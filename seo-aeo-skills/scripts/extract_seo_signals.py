#!/usr/bin/env python3
"""Extract SEO/AEO signals from HTML.

Usage:
    python3 extract_seo_signals.py <file.html>
    cat page.html | python3 extract_seo_signals.py

Output: JSON to stdout with SEO/AEO signals.
Dependencies: Python 3 stdlib only (no pip install required).
"""

import json
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse


class SEOSignalExtractor(HTMLParser):
    """Parse HTML and extract SEO/AEO signals."""

    def __init__(self):
        super().__init__()
        self._tag_stack = []
        self._current_text = []
        self._in_body = False
        self._in_script = False
        self._in_style = False
        self._script_type = ""
        self._script_content = ""

        # Collected signals
        self.title = ""
        self.meta_description = ""
        self.og_title = ""
        self.canonical = ""
        self.headings = []
        self.json_ld_raw = []
        self.body_text_parts = []
        self.lists_count = 0
        self.tables_count = 0
        self.images_count = 0
        self.links = []
        self.h2_sections = []

        # State for BLUF analysis
        self._current_heading = None
        self._after_heading_content = []
        self._collecting_after_heading = False
        self._after_heading_tags_seen = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs_dict = dict(attrs)
        self._tag_stack.append(tag)

        if tag == "body":
            self._in_body = True

        if tag == "script":
            self._in_script = True
            self._script_type = attrs_dict.get("type", "")
            self._script_content = ""
        elif tag == "style":
            self._in_style = True

        # Meta tags
        if tag == "meta":
            name = attrs_dict.get("name", "").lower()
            prop = attrs_dict.get("property", "").lower()
            content = attrs_dict.get("content", "")
            if name == "description":
                self.meta_description = content
            elif prop == "og:title":
                self.og_title = content

        # Canonical
        if tag == "link":
            rel = attrs_dict.get("rel", "").lower()
            href = attrs_dict.get("href", "")
            if rel == "canonical" and href:
                self.canonical = href

        # Headings
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._current_text = []
            # Finalize any pending BLUF section
            if self._collecting_after_heading and self._current_heading:
                self._finalize_bluf_section()
            if tag == "h2":
                self._current_heading = {"tag": tag.upper()}
                self._after_heading_content = []
                self._collecting_after_heading = False
                self._after_heading_tags_seen = 0

        # Content elements after heading (for BLUF analysis)
        if self._collecting_after_heading and tag in ("p", "ul", "ol", "table", "div"):
            self._after_heading_tags_seen += 1
            if self._after_heading_tags_seen <= 1:
                self._current_text = []

        # Count structural elements
        if tag in ("ul", "ol") and self._in_body:
            self.lists_count += 1
        elif tag == "table" and self._in_body:
            self.tables_count += 1
        elif tag == "img" and self._in_body:
            self.images_count += 1

        # Links
        if tag == "a" and self._in_body:
            href = attrs_dict.get("href", "")
            if href and href.startswith("http"):
                self.links.append(href)

    def handle_endtag(self, tag):
        tag = tag.lower()

        if tag == "script":
            self._in_script = False
            if self._script_type == "application/ld+json" and self._script_content.strip():
                try:
                    parsed = json.loads(self._script_content)
                    self.json_ld_raw.append(parsed)
                except (json.JSONDecodeError, ValueError):
                    pass
            self._script_type = ""
            self._script_content = ""
        elif tag == "style":
            self._in_style = False

        if tag == "title" and not self._in_body:
            self.title = " ".join(self._current_text).strip()
            self._current_text = []

        # Headings
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            text = " ".join(self._current_text).strip()
            is_question = bool(
                re.search(
                    r"\?$|^(what|how|why|when|where|who|which|can|do|does|is|are|should)\b",
                    text,
                    re.IGNORECASE,
                )
            )
            self.headings.append(
                {"tag": tag.upper(), "text": text[:120], "is_question": is_question}
            )
            if tag == "h2" and self._current_heading:
                self._current_heading["text"] = text[:120]
                self._collecting_after_heading = True
                self._after_heading_content = []
                self._after_heading_tags_seen = 0
            self._current_text = []

        # Capture first content block after H2 for BLUF
        if (
            self._collecting_after_heading
            and self._after_heading_tags_seen == 1
            and tag in ("p", "ul", "ol", "table", "div")
        ):
            content = " ".join(self._current_text).strip()
            if content:
                self._after_heading_content.append(content)
            self._current_text = []

        if tag == "body":
            if self._collecting_after_heading and self._current_heading:
                self._finalize_bluf_section()
            self._in_body = False

        if self._tag_stack and self._tag_stack[-1] == tag:
            self._tag_stack.pop()

    def handle_data(self, data):
        if self._in_script:
            self._script_content += data
            return
        if self._in_style:
            return

        stripped = data.strip()
        if not stripped:
            return

        # Title collection
        if self._tag_stack and self._tag_stack[-1] == "title":
            self._current_text.append(stripped)

        # Heading text
        if self._tag_stack and self._tag_stack[-1] in (
            "h1", "h2", "h3", "h4", "h5", "h6",
        ):
            self._current_text.append(stripped)

        # After-heading content
        if (
            self._collecting_after_heading
            and self._after_heading_tags_seen == 1
            and self._tag_stack
            and self._tag_stack[-1] in ("p", "ul", "ol", "table", "div", "li", "td", "th", "span", "a", "strong", "em", "b", "i")
        ):
            self._current_text.append(stripped)

        # Body text for word count
        if self._in_body:
            self.body_text_parts.append(stripped)

    def _finalize_bluf_section(self):
        """Save the current BLUF section data."""
        if not self._current_heading or "text" not in self._current_heading:
            self._collecting_after_heading = False
            return

        first_content = " ".join(self._after_heading_content).strip()[:250]
        word_count = len(first_content.split()) if first_content else 0
        starts_with_answer = bool(
            re.search(
                r"^[A-Z].*\b(is|are|means|refers|provides|includes|offers|was|were|has|have|can|will|should|does|do)\b",
                first_content,
                re.IGNORECASE,
            )
        ) if first_content else False

        self.h2_sections.append(
            {
                "heading": self._current_heading.get("text", ""),
                "first_content": first_content,
                "word_count": word_count,
                "starts_with_answer": starts_with_answer,
            }
        )
        self._current_heading = None
        self._collecting_after_heading = False

    def get_results(self, url=""):
        """Return all extracted signals as a dict."""
        # Compute word count from body text
        body_text = " ".join(self.body_text_parts)
        word_count = len(body_text.split()) if body_text else 0

        # Extract schema types from JSON-LD
        schema_types = []
        for item in self.json_ld_raw:
            self._collect_schema_types(item, schema_types)

        # Determine page URL for link classification
        page_host = ""
        if url:
            try:
                page_host = urlparse(url).hostname or ""
            except Exception:
                pass

        # Classify links
        internal_links = 0
        external_links = 0
        for link in self.links:
            try:
                link_host = urlparse(link).hostname or ""
                if page_host and link_host == page_host:
                    internal_links += 1
                else:
                    external_links += 1
            except Exception:
                external_links += 1

        # JSON-LD type info
        json_ld_info = []
        for item in self.json_ld_raw:
            t = self._get_type(item)
            json_ld_info.append({"type": t, "raw": item})

        # Schema feature flags
        types_lower = [t.lower() for t in schema_types]
        has_faq = any("faqpage" in t for t in types_lower)
        has_howto = any("howto" in t for t in types_lower)
        has_article = any(
            t in ("article", "newsarticle", "blogposting", "technicalarticle")
            for t in types_lower
        )
        has_breadcrumb = any("breadcrumblist" in t for t in types_lower)

        return {
            "url": url,
            "title": self.title,
            "meta_description": self.meta_description,
            "og_title": self.og_title,
            "canonical": self.canonical,
            "word_count": word_count,
            "headings": self.headings,
            "json_ld": json_ld_info,
            "schema_types": list(dict.fromkeys(schema_types)),
            "has_faq_schema": has_faq,
            "has_howto_schema": has_howto,
            "has_article_schema": has_article,
            "has_breadcrumb_schema": has_breadcrumb,
            "bluf_analysis": self.h2_sections,
            "lists_count": self.lists_count,
            "tables_count": self.tables_count,
            "images_count": self.images_count,
            "internal_links": internal_links,
            "external_links": external_links,
        }

    def _get_type(self, obj):
        """Extract @type from a JSON-LD object."""
        if isinstance(obj, dict):
            return obj.get("@type", "Unknown")
        return "Unknown"

    def _collect_schema_types(self, obj, types):
        """Recursively collect all @type values from JSON-LD."""
        if isinstance(obj, dict):
            if "@type" in obj:
                t = obj["@type"]
                if isinstance(t, list):
                    types.extend(t)
                else:
                    types.append(t)
            if "@graph" in obj and isinstance(obj["@graph"], list):
                for item in obj["@graph"]:
                    self._collect_schema_types(item, types)
            # Check nested objects
            for key, val in obj.items():
                if key not in ("@type", "@graph") and isinstance(val, (dict, list)):
                    self._collect_schema_types(val, types)
        elif isinstance(obj, list):
            for item in obj:
                self._collect_schema_types(item, types)


def main():
    # Read HTML from file argument or stdin
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                html_content = f.read()
        except FileNotFoundError:
            print(json.dumps({"error": f"File not found: {filepath}"}), file=sys.stderr)
            sys.exit(1)
        url = filepath
    else:
        html_content = sys.stdin.read()
        url = ""

    # Parse and extract
    extractor = SEOSignalExtractor()
    extractor.feed(html_content)
    results = extractor.get_results(url=url)

    # Output JSON
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
