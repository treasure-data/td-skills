#!/usr/bin/env python3
"""Extract SEO/AEO signals from HTML.

Usage:
    python3 extract_page_signals.py page.html --url https://example.com/page
    python3 extract_page_signals.py page.html                    # url defaults to file path
    cat page.html | python3 extract_page_signals.py --url https://example.com/page
    python3 extract_page_signals.py page.html --compact           # minified JSON
    python3 extract_page_signals.py page.html --fields title,word_count,schema_types

Output: JSON to stdout with SEO/AEO signals.
Dependencies: Python 3 stdlib only (no pip install required).

Output fields:
    url, title, meta_description, og_title, og_description, og_image,
    twitter_card, canonical, word_count, headings, json_ld, schema_types,
    has_faq_schema, has_howto_schema, has_article_schema, has_breadcrumb_schema,
    has_video_object_schema, has_local_business_schema, has_speakable_schema,
    entity_properties, bluf_analysis (with bluf_pattern_type), lists_count,
    tables_count, images_count, total_images, images_with_alt, images_missing_alt,
    alt_texts, internal_links, external_links, internal_link_anchors
"""

import argparse
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
        self.og_description = ""
        self.og_image = ""
        self.twitter_card = ""
        self.canonical = ""
        self.headings = []
        self.json_ld_raw = []
        self.body_text_parts = []
        self.lists_count = 0
        self.tables_count = 0
        self.images_count = 0
        self.images_with_alt = 0
        self.images_missing_alt = 0
        self.alt_texts = []
        self.links = []
        self.internal_link_anchors = []
        self.h2_sections = []

        # State for BLUF analysis
        self._current_heading = None
        self._after_heading_content = []
        self._collecting_after_heading = False
        self._after_heading_tags_seen = 0

        # State for anchor text tracking
        self._in_anchor = False
        self._anchor_href = ""
        self._anchor_text_parts = []

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
            elif name == "twitter:card":
                self.twitter_card = content
            elif prop == "og:title":
                self.og_title = content
            elif prop == "og:description":
                self.og_description = content
            elif prop == "og:image":
                self.og_image = content

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
            alt = attrs_dict.get("alt")
            if alt is not None and alt.strip():
                self.images_with_alt += 1
                self.alt_texts.append(alt.strip()[:100])
            else:
                self.images_missing_alt += 1

        # Links
        if tag == "a" and self._in_body:
            href = attrs_dict.get("href", "")
            if href and href.startswith("http"):
                self.links.append(href)
            # Track anchor text for internal links
            self._in_anchor = True
            self._anchor_href = href
            self._anchor_text_parts = []

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

        # Finalize anchor text for internal link tracking
        if tag == "a" and self._in_anchor:
            anchor_text = " ".join(self._anchor_text_parts).strip()
            if anchor_text and self._anchor_href:
                self.internal_link_anchors.append(
                    {"text": anchor_text[:100], "href": self._anchor_href}
                )
            self._in_anchor = False
            self._anchor_href = ""
            self._anchor_text_parts = []

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

        # Anchor text for internal link tracking
        if self._in_anchor:
            self._anchor_text_parts.append(stripped)

        # Body text for word count
        if self._in_body:
            self.body_text_parts.append(stripped)

    def _classify_bluf_pattern(self, text):
        """Classify the BLUF pattern type of a text block.

        Returns one of: definition, number, verdict, step, yesno, none
        """
        if not text:
            return "none"
        text_lower = text.lower().strip()
        # Yes/No pattern: starts with Yes/No
        if re.match(r"^(yes|no)\b", text_lower):
            return "yesno"
        # Number pattern: starts with a number, currency, or contains cost/price early
        if re.match(r"^[\$€£¥]?\d|^\d", text_lower):
            return "number"
        # Step pattern: starts with step indicators or imperative verbs
        if re.match(
            r"^(step\s+\d|first,?\s|to\s+\w+,?\s|set\s+up|install|create|open|go\s+to|navigate|click|run|start)",
            text_lower,
        ):
            return "step"
        # Verdict pattern: contains comparison words early
        if re.search(r"^.{0,60}\b(better|best|worse|winner|recommend|choose|prefer|excels|superior)\b", text_lower):
            return "verdict"
        # Definition pattern: contains "is a/an/the" or "refers to" or "means" early
        if re.search(r"^.{0,80}\b(is\s+(a|an|the)\b|refers?\s+to|means|defined\s+as)", text_lower):
            return "definition"
        return "none"

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
                "bluf_pattern_type": self._classify_bluf_pattern(first_content),
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
        has_video_object_schema = any("videoobject" in t for t in types_lower)
        has_local_business_schema = any("localbusiness" in t or t.endswith("business") for t in types_lower)
        has_speakable_schema = any("speakable" in t for t in types_lower)

        # Entity properties from JSON-LD
        entity_props = self._extract_entity_properties()

        # Filter internal link anchors (keep only same-host links)
        filtered_anchors = []
        for anchor in self.internal_link_anchors:
            href = anchor.get("href", "")
            if not href.startswith("http"):
                # Relative links are internal
                filtered_anchors.append(anchor)
            elif page_host:
                try:
                    if urlparse(href).hostname == page_host:
                        filtered_anchors.append(anchor)
                except Exception:
                    pass

        return {
            "url": url,
            "title": self.title,
            "meta_description": self.meta_description,
            "og_title": self.og_title,
            "og_description": self.og_description,
            "og_image": self.og_image,
            "twitter_card": self.twitter_card,
            "canonical": self.canonical,
            "word_count": word_count,
            "headings": self.headings,
            "json_ld": json_ld_info,
            "schema_types": list(dict.fromkeys(schema_types)),
            "has_faq_schema": has_faq,
            "has_howto_schema": has_howto,
            "has_article_schema": has_article,
            "has_breadcrumb_schema": has_breadcrumb,
            "has_video_object_schema": has_video_object_schema,
            "has_local_business_schema": has_local_business_schema,
            "has_speakable_schema": has_speakable_schema,
            "entity_properties": entity_props,
            "bluf_analysis": self.h2_sections,
            "lists_count": self.lists_count,
            "tables_count": self.tables_count,
            "images_count": self.images_count,
            "total_images": self.images_count,
            "images_with_alt": self.images_with_alt,
            "images_missing_alt": self.images_missing_alt,
            "alt_texts": self.alt_texts,
            "internal_links": internal_links,
            "external_links": external_links,
            "internal_link_anchors": filtered_anchors,
        }

    def _extract_entity_properties(self):
        """Extract entity-related properties from JSON-LD data."""
        result = {
            "has_same_as": False,
            "same_as_urls": [],
            "has_about": False,
            "has_main_entity": False,
            "author_details": None,
        }
        for item in self.json_ld_raw:
            self._walk_entity_properties(item, result)
        return result

    def _walk_entity_properties(self, obj, result):
        """Recursively walk JSON-LD to find entity properties."""
        if not isinstance(obj, dict):
            if isinstance(obj, list):
                for item in obj:
                    self._walk_entity_properties(item, result)
            return

        if "sameAs" in obj:
            result["has_same_as"] = True
            same_as = obj["sameAs"]
            if isinstance(same_as, list):
                result["same_as_urls"].extend(str(u) for u in same_as)
            elif isinstance(same_as, str):
                result["same_as_urls"].append(same_as)

        if "about" in obj:
            result["has_about"] = True
        if "mainEntity" in obj or "mainEntityOfPage" in obj:
            result["has_main_entity"] = True

        if "author" in obj and result["author_details"] is None:
            author = obj["author"]
            if isinstance(author, dict):
                result["author_details"] = {
                    "type": author.get("@type", ""),
                    "name": author.get("name", ""),
                    "url": author.get("url", ""),
                }
            elif isinstance(author, str):
                result["author_details"] = {"name": author}

        if "@graph" in obj and isinstance(obj["@graph"], list):
            for item in obj["@graph"]:
                self._walk_entity_properties(item, result)

        for key, val in obj.items():
            if key not in ("@graph", "sameAs") and isinstance(val, (dict, list)):
                self._walk_entity_properties(val, result)

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
    parser = argparse.ArgumentParser(
        description="Extract SEO/AEO signals from HTML. Outputs JSON to stdout.",
        epilog=(
            "Examples:\n"
            "  %(prog)s page.html --url https://example.com/page\n"
            "  %(prog)s page.html --compact\n"
            "  %(prog)s page.html --fields title,word_count,schema_types\n"
            "  cat page.html | %(prog)s --url https://example.com/page\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "file", nargs="?", default=None,
        help="HTML file to analyze. Reads from stdin if omitted.",
    )
    parser.add_argument(
        "--url", default=None,
        help="Page URL for internal/external link classification. "
             "Defaults to file path if not specified.",
    )
    parser.add_argument(
        "--compact", action="store_true",
        help="Output minified JSON (no indentation).",
    )
    parser.add_argument(
        "--fields", default=None,
        help="Comma-separated list of fields to include in output. "
             "Example: --fields title,word_count,schema_types,bluf_analysis",
    )
    args = parser.parse_args()

    # Read HTML
    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8", errors="replace") as f:
                html_content = f.read()
        except FileNotFoundError:
            print(json.dumps({"error": f"File not found: {args.file}"}), file=sys.stderr)
            sys.exit(1)
        url = args.url if args.url else args.file
    else:
        html_content = sys.stdin.read()
        url = args.url or ""

    # Parse and extract
    extractor = SEOSignalExtractor()
    extractor.feed(html_content)
    results = extractor.get_results(url=url)

    # Filter fields if requested
    if args.fields:
        requested = [f.strip() for f in args.fields.split(",")]
        results = {k: v for k, v in results.items() if k in requested}

    # Output JSON
    indent = None if args.compact else 2
    print(json.dumps(results, indent=indent, ensure_ascii=False))


if __name__ == "__main__":
    main()
