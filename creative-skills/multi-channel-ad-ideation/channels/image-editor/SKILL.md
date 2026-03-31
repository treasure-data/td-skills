---
name: image-editor
description: Interactive visual editor for Instagram ad images. Use when editing generated images, adjusting text overlays, repositioning logos, or modifying ad visual elements.
---

# Instagram Studio Editor V2

Interactive drag-and-drop editor for Instagram ad overlays — headline text, brand text, and company logo. Renders instantly via `render_react` using a CSS gradient placeholder instead of an embedded image preview.

## Architecture

```
render_react (editor in artifact panel)
  ├─ CSS gradient placeholder (NO base64)
  ├─ Draggable text overlays (headline + brand)
  ├─ Draggable logo overlay (position, size, opacity, variant, tint)
  ├─ Control panel (font, size, color, opacity, gradient)
  └─ "Apply Changes" → copies config to clipboard
         ↓  (automatic)
Clipboard Poller (background task, polls pbpaste every 2s)
  ├─ Detects valid editor config JSON
  └─ Writes to /tmp/editor_apply_ready.json
         ↓
Python/Pillow (auto-applies config to FULL-RES image)
  ├─ Composites logo with variant selection, opacity, tint
  ├─ Composites text with exact parameters
  └─ Saves final PNG → opens via open_file
```

### Key Constraints

- `render_react` sandbox blocks `file://`, `localhost`, `clipboard.writeText()`, and postMessage
- Data prop size correlates with load time: 0KB=instant, 2KB=30s, 12KB=4min+
- Solution: zero base64, CSS gradient placeholder, `execCommand("copy")` fallback
- macOS `pbpaste` polls clipboard to bridge React sandbox back to Claude

---

## Workflow

**Trigger phrases**: "open the editor", "studio editor", "visual editor", "edit this", "let me edit", "drag text", "move the text", "reposition headline", "adjust overlay"

### Execution Order

1. Claude starts **clipboard poller** as background task (`run_in_background: true`)
2. Claude calls `render_react` with editor component + tiny data prop (~600 bytes)
3. Claude calls `TaskOutput` with poller's `task_id`, `block: true`, `timeout: 300000`
4. User drags overlays, adjusts controls, clicks **"Apply Changes"**
5. Poller detects config JSON on clipboard, writes to `/tmp/editor_apply_ready.json`, exits
6. Claude reads config, runs Pillow applicator, opens final PNG via `open_file`

**Workflow note**: This approach skips the Python prep step and base64 encoding. The clipboard poller automatically bridges the React sandbox using macOS `pbpaste`, so no manual paste is needed from the user.

---

## Step 1: Build the Data Prop

Claude constructs this JSON directly — no Bash/Python needed:

```json
{
  "bgGradient": "linear-gradient(135deg, #1e3a5f 0%, #2a4a3f 30%, #3d5a3a 60%, #1a2f1a 100%)",
  "headline": {
    "text": "Adventure Awaits", "x": 512, "y": 939,
    "fontSize": 72, "fontFamily": "helvetica",
    "color": "#FFFFFF", "opacity": 100, "align": "center"
  },
  "brand": {
    "text": "Outdoor Supply Co.", "x": 984, "y": 984,
    "fontSize": 32, "fontFamily": "sans",
    "color": "#FFF0D2", "opacity": 78, "align": "right"
  },
  "logo": {
    "x": 884, "y": 40, "width": 100,
    "opacity": 100, "tint": null, "variant": "auto"
  },
  "gradient": { "style": "medium", "position": "bottom", "alphaMax": 180 }
}
```

### bgGradient Guidelines

Pick CSS gradient colors approximating the generated image's dominant colors:
- **Nature/outdoor**: `linear-gradient(135deg, #1e3a5f 0%, #2a4a3f 30%, #3d5a3a 60%, #1a2f1a 100%)`
- **Sunset/warm**: `linear-gradient(135deg, #8B4513 0%, #D2691E 40%, #FF8C00 70%, #FFD700 100%)`
- **Urban/dark**: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
- **Snow/bright**: `linear-gradient(135deg, #e8e8e8 0%, #b0c4de 40%, #87ceeb 70%, #f0f8ff 100%)`
- **Ocean/water**: `linear-gradient(135deg, #006994 0%, #0077b6 40%, #00b4d8 70%, #90e0ef 100%)`

### Logo Data Prop

Default: top-right at `x: width - logoWidth - 40`, `y: 40`, `width: 100`, `variant: "auto"`, `tint: null`, `opacity: 100`. Check brand guidelines for logo paths and adjust position from previous render.

---

## Step 1.5: Start Clipboard Poller

Launch with `run_in_background: true` **before** calling `render_react`:

```bash
python3 << 'PYEOF'
import subprocess, json, time, hashlib, os

POLL_INTERVAL = 2
TIMEOUT = 300
MARKER_FILE = "/tmp/editor_apply_ready.json"

if os.path.exists(MARKER_FILE):
    os.remove(MARKER_FILE)

result = subprocess.run(["pbpaste"], capture_output=True, text=True)
last_hash = hashlib.md5(result.stdout.strip().encode()).hexdigest()

start = time.time()
while time.time() - start < TIMEOUT:
    time.sleep(POLL_INTERVAL)
    result = subprocess.run(["pbpaste"], capture_output=True, text=True)
    clip = result.stdout.strip()
    clip_hash = hashlib.md5(clip.encode()).hexdigest()
    if clip_hash != last_hash:
        last_hash = clip_hash
        try:
            config = json.loads(clip)
            if all(k in config for k in ["headline", "brand", "logo", "gradient"]):
                with open(MARKER_FILE, "w") as f:
                    json.dump(config, f)
                print("EDITOR_CONFIG_DETECTED")
                break
        except (json.JSONDecodeError, TypeError):
            pass
if not os.path.exists(MARKER_FILE):
    print("TIMEOUT_NO_CONFIG")
PYEOF
```

The poller snapshots the initial clipboard and only triggers on **new** valid config JSON, preventing false triggers.

---

## Step 2: React Editor Component

Call `mcp__tdx-studio__render_react` with title `"Instagram Ad Editor V2"`, the data prop from Step 1, and the component code below.

**Sandbox rules** — the `render_react` sandbox mangles JSX, template literals, and spread syntax. Use these alternatives:
- `React.createElement()` (aliased as `e`) instead of JSX
- String concatenation instead of template literals
- `Object.assign({}, obj, {key: val})` instead of spread
- `function Q(props)` with `var data=props.data` — NOT destructured params
- All helpers defined INSIDE the component as `var fn=function(){}`
- Use the EXACT code below — do NOT add code (every character increases load time)

```javascript
var e=React.createElement,CC=["#FFF","#FFF5E1","#FFBF47","#FFD700","#FF8C42","#EC4899","#60A5FA","#1A1A1A"],TC=[null,"#FFF","#FFF5E1","#FFBF47","#FFD700","#1B3022","#B35D33","#1A1A1A"],FT=[["helvetica","Helvetica"],["serif","Georgia"],["sans","Arial"]],L="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1",R="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700 accent-blue-600",I="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none",P="space-y-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800 shadow-sm",V="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
export default function Q(props){
var data=props.data;
var mk=function(s,k,v){s(function(p){var o={};o[k]=v;return Object.assign({},p,o);});};
var _t=useState("headline"),tab=_t[0],sT=_t[1],_h=useState(data.headline),hl=_h[0],sH=_h[1],_b=useState(data.brand),br=_b[0],sB=_b[1],_l=useState(data.logo||{x:884,y:40,width:100,opacity:100,tint:null,variant:"auto"}),lo=_l[0],sL=_l[1],_g=useState(data.gradient),gr=_g[0],sG=_g[1],_d=useState(null),dg=_d[0],sD=_d[1],_a=useState(null),ap=_a[0],sA=_a[1],W=1024,D=512,sc=D/W;
var mm=function(ev){if(!dg)return;var el=document.querySelector("[data-cv]");if(!el)return;var r=el.getBoundingClientRect(),x=Math.max(0,Math.min(W,Math.round((ev.clientX-r.left)/sc))),y=Math.max(0,Math.min(W,Math.round((ev.clientY-r.top)/sc)));(dg==="headline"?sH:dg==="brand"?sB:sL)(function(p){return Object.assign({},p,{x:x,y:y});});};
var cfg=JSON.stringify({headline:hl,brand:br,logo:lo,gradient:gr},null,2);
var doApply=function(){var t=document.createElement("textarea");t.value=cfg;t.style.cssText="position:fixed;left:-9999px";document.body.appendChild(t);t.select();try{document.execCommand("copy");}catch(x){}document.body.removeChild(t);sA("r");};
var gOv=useMemo(function(){if(gr.style==="none")return null;var a=(gr.alphaMax/255).toFixed(2),h=({subtle:25,medium:30,heavy:40})[gr.style]||30,z="rgba(0,0,0,0)",f="rgba(0,0,0,"+a+")",b={position:"absolute",left:0,right:0,pointerEvents:"none"};if(gr.position==="bottom")return Object.assign({},b,{bottom:0,height:h+"%",background:"linear-gradient(to bottom,"+z+","+f+")"});if(gr.position==="top")return Object.assign({},b,{top:0,height:h+"%",background:"linear-gradient(to top,"+z+","+f+")"});return Object.assign({},b,{top:((100-h)/2)+"%",height:h+"%",background:"radial-gradient(ellipse at center,"+f+" 0%,"+z+" 100%)"});},[gr]);
var bn=function(l,a,fn){return e("button",{onClick:fn,className:"flex-1 py-1 text-xs font-medium rounded-md "+(a?"bg-blue-600 text-white":"bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400")},l);};
var sl=function(l,v,mn,mx,fn){return e("div",null,e("label",{className:L},l),e("input",{type:"range",min:""+mn,max:""+mx,value:v,onChange:function(ev){fn(parseInt(ev.target.value));},className:R}));};
var cp=function(v,fn,items){return e("div",null,e("div",{className:"flex flex-wrap gap-1.5 mb-1"},items.map(function(c,i){var ac=c===v||(c!==null&&v!==null&&(v+"").toUpperCase()===(c+"").toUpperCase());return e("button",{key:i,onClick:function(){fn(c);},className:"w-6 h-6 rounded-full border-2 "+(ac?"border-blue-500 ring-2 ring-blue-300":"border-gray-300 dark:border-gray-600"),style:{backgroundColor:c||"#f0f0f0"}},c===null?e("span",{style:{fontSize:"14px",lineHeight:"20px"}},"\u2205"):null);})),e("input",{type:"text",value:v||"",onChange:function(ev){fn(ev.target.value||null);},className:"w-full px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none",placeholder:"#hex"}));};
var xy=function(x,y){return e("div",{className:"flex gap-2"},e("div",{className:"flex-1"},e("label",{className:"text-xs text-gray-500 block mb-0.5"},"X"),e("div",{className:V},x+"px")),e("div",{className:"flex-1"},e("label",{className:"text-xs text-gray-500 block mb-0.5"},"Y"),e("div",{className:V},y+"px")));};
var tl=function(ly,nm){var sx=ly.x*sc,sy=ly.y*sc,fs=ly.fontSize*sc,ff=ly.fontFamily==="serif"?"Georgia,serif":ly.fontFamily==="helvetica"?"Helvetica,Arial,sans-serif":"Arial,sans-serif",an=ly.align==="right"?"end":ly.align==="left"?"start":"middle",on=tab===nm;return e("g",{key:nm,style:{cursor:dg===nm?"grabbing":"grab"},onMouseDown:function(ev){ev.preventDefault();sD(nm);}},e("text",{x:sx,y:sy,textAnchor:an,dominantBaseline:"middle",style:{fontSize:fs+"px",fontFamily:ff,fontWeight:"bold",fill:ly.color,opacity:ly.opacity/100,filter:"drop-shadow(2px 2px 3px rgba(0,0,0,0.6))",userSelect:"none",pointerEvents:"all"}},ly.text),on?e("rect",{x:sx-(an==="end"?fs*ly.text.length*0.35:an==="middle"?fs*ly.text.length*0.175:0),y:sy-fs*0.6,width:Math.max(fs*ly.text.length*0.38,40),height:fs*1.2,fill:"none",stroke:"#60A5FA",strokeWidth:"1.5",strokeDasharray:"4 2",rx:"3"}):null);};
var lgl=function(){var lx=lo.x*sc,ly=lo.y*sc,lw=lo.width*sc,lh=lw,on=tab==="logo",dk=lo.variant==="dark",lt=lo.variant==="light",bg=lt?"rgba(50,50,50,.85)":dk?"rgba(240,240,240,.85)":"rgba(100,100,100,.7)",tf=lt?"#e0e0e0":dk?"#333":"#ccc";if(lo.tint){bg=lo.tint;tf="#FFF";}return e("g",{key:"logo",style:{cursor:dg==="logo"?"grabbing":"grab",opacity:lo.opacity/100},onMouseDown:function(ev){ev.preventDefault();sD("logo");}},e("rect",{x:lx,y:ly,width:lw,height:lh,rx:3,fill:bg,stroke:on?"#60A5FA":"none",strokeWidth:on?"1.5":"0"}),e("text",{x:lx+lw/2,y:ly+lh/2,textAnchor:"middle",dominantBaseline:"middle",style:{fontSize:lh*0.28+"px",fontFamily:"Arial,sans-serif",fontWeight:"bold",fill:tf,userSelect:"none",pointerEvents:"none"}},"LOGO"),e("text",{x:lx+lw/2,y:ly+lh*0.75,textAnchor:"middle",dominantBaseline:"middle",style:{fontSize:lh*0.15+"px",fontFamily:"Arial,sans-serif",fill:tf,opacity:0.6,userSelect:"none",pointerEvents:"none"}},lo.variant));};
var ctl=function(){if(tab==="logo")return e("div",{className:P},e("div",null,e("label",{className:L},"Variant"),e("div",{className:"flex gap-1"},["auto","light","dark"].map(function(v){return bn(v.charAt(0).toUpperCase()+v.slice(1),lo.variant===v,function(){mk(sL,"variant",v);});}))),sl("Size: "+lo.width+"px",lo.width,40,200,function(v){mk(sL,"width",v);}),sl("Opacity: "+lo.opacity+"%",lo.opacity,10,100,function(v){mk(sL,"opacity",v);}),cp(lo.tint,function(v){mk(sL,"tint",v);},TC),xy(lo.x,lo.y));var act=tab==="headline"?hl:br,sf=tab==="headline"?sH:sB;return e("div",{className:P},e("div",null,e("label",{className:L},"Text"),e("input",{type:"text",value:act.text,onChange:function(ev){mk(sf,"text",ev.target.value);},className:I})),e("div",null,e("label",{className:L},"Font"),e("select",{value:act.fontFamily,onChange:function(ev){mk(sf,"fontFamily",ev.target.value);},className:I},FT.map(function(f){return e("option",{key:f[0],value:f[0]},f[1]);}))),sl("Size: "+act.fontSize+"px",act.fontSize,16,120,function(v){mk(sf,"fontSize",v);}),cp(act.color,function(v){mk(sf,"color",v);},CC),sl("Opacity: "+act.opacity+"%",act.opacity,10,100,function(v){mk(sf,"opacity",v);}),e("div",null,e("label",{className:L},"Align"),e("div",{className:"flex gap-1"},["left","center","right"].map(function(a){return bn(a.charAt(0).toUpperCase()+a.slice(1),act.align===a,function(){mk(sf,"align",a);});}))),xy(act.x,act.y));};
return e("div",{className:"flex flex-col lg:flex-row gap-4 p-3 bg-gray-50 dark:bg-gray-950 min-h-[520px]",onMouseMove:mm,onMouseUp:function(){sD(null);},onMouseLeave:function(){sD(null);}},e("div",{className:"flex-shrink-0"},e("div",{className:"text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex justify-between"},e("span",null,"Preview (1024x1024)"),e("span",{className:"text-blue-500"},"Drag to reposition")),e("div",{"data-cv":true,style:{width:D,height:D,position:"relative",borderRadius:8,overflow:"hidden"},className:"border border-gray-300 dark:border-gray-700 shadow-lg"},e("div",{style:{width:"100%",height:"100%",background:data.bgGradient||"linear-gradient(135deg,#1a365d,#2d3748,#1a202c)"}}),gOv?e("div",{style:gOv}):null,e("svg",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%"},viewBox:"0 0 512 512"},lgl(),tl(hl,"headline"),tl(br,"brand")))),e("div",{className:"flex-1 min-w-[280px] max-w-[340px]"},e("div",{className:"flex gap-1 mb-3"},bn("Headline",tab==="headline",function(){sT("headline");}),bn("Brand",tab==="brand",function(){sT("brand");}),bn("Logo",tab==="logo",function(){sT("logo");})),ctl(),e("div",{className:"mt-3 "+P},e("label",{className:"text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2"},"Gradient"),e("div",{className:"flex gap-1 mb-2"},["none","subtle","medium","heavy"].map(function(v){var am={none:0,subtle:120,medium:180,heavy:220};return bn(v.charAt(0).toUpperCase()+v.slice(1),gr.style===v,function(){sG(function(g){return Object.assign({},g,{style:v,alphaMax:am[v]});});});})),e("div",{className:"flex gap-1 mb-2"},["top","center","bottom"].map(function(v){return bn(v.charAt(0).toUpperCase()+v.slice(1),gr.position===v,function(){sG(function(g){return Object.assign({},g,{position:v});});});})),sl("Alpha: "+gr.alphaMax,gr.alphaMax,0,255,function(v){sG(function(g){return Object.assign({},g,{alphaMax:v});})})),ap?e("div",{className:"mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg text-center text-sm text-amber-700 dark:text-amber-300 font-semibold"},"Rendering..."):null,e("button",{onClick:doApply,disabled:!!ap,className:"w-full mt-3 py-2.5 px-4 text-sm font-semibold rounded-lg shadow-sm "+(ap?"bg-amber-500 text-white cursor-wait":"bg-blue-600 hover:bg-blue-700 text-white")},ap?"Rendering...":"Apply Changes")));}
```

---

## Step 3: Config-to-Pillow Applicator

When `TaskOutput` returns `EDITOR_CONFIG_DETECTED`, read `/tmp/editor_apply_ready.json` and apply automatically:

```python
import json, os, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont

with open("/tmp/editor_apply_ready.json", "r") as f:
    config = json.load(f)

headline = config["headline"]
brand_cfg = config["brand"]
logo_cfg = config.get("logo", None)
gradient = config["gradient"]

# Find base image (pre-logo, pre-text) — uses *_base.png not *_with_logo.png
base_candidates = sorted(glob.glob("/tmp/*_base.png"), key=os.path.getmtime, reverse=True)
if not base_candidates:
    raise FileNotFoundError("No base image found in /tmp/")
img = Image.open(base_candidates[0]).convert("RGBA")
width, height = img.size

# --- Logo compositing ---
if logo_cfg:
    # Replace these with actual paths from brand guidelines
    LOGO_DARK = "<BRAND_GUIDELINES_LOGO_DARK_PATH>"
    LOGO_LIGHT = "<BRAND_GUIDELINES_LOGO_LIGHT_PATH>"
    logo_x, logo_y = logo_cfg["x"], logo_cfg["y"]
    logo_width = logo_cfg.get("width", 100)
    logo_opacity = logo_cfg.get("opacity", 100)
    logo_tint = logo_cfg.get("tint", None)
    logo_variant = logo_cfg.get("variant", "auto")

    if logo_variant == "auto":
        region = img.crop((max(0,logo_x), max(0,logo_y),
                          min(width,logo_x+logo_width), min(height,logo_y+logo_width)))
        pixels = np.array(region.convert("RGB"))
        avg_lum = np.mean(0.299*pixels[:,:,0] + 0.587*pixels[:,:,1] + 0.114*pixels[:,:,2])
        logo_path = LOGO_LIGHT if avg_lum < 128 else LOGO_DARK
    elif logo_variant == "light":
        logo_path = LOGO_LIGHT
    else:
        logo_path = LOGO_DARK

    logo_img = Image.open(logo_path).convert("RGBA")
    aspect = logo_img.height / logo_img.width
    logo_h = int(logo_width * aspect)
    logo_img = logo_img.resize((logo_width, logo_h), Image.Resampling.LANCZOS)

    if logo_tint:
        h = logo_tint.lstrip("#")
        tint_layer = Image.new("RGBA", logo_img.size,
                               (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 255))
        _, _, _, alpha = logo_img.split()
        tint_layer.putalpha(alpha)
        logo_img = tint_layer

    if logo_opacity < 100:
        _, _, _, alpha = logo_img.split()
        alpha = alpha.point(lambda a: int(a * logo_opacity / 100))
        logo_img.putalpha(alpha)

    img.paste(logo_img, (logo_x, logo_y), logo_img)

# --- Gradient overlay ---
if gradient["style"] != "none":
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    height_pct = {"subtle": 0.25, "medium": 0.30, "heavy": 0.40}.get(gradient["style"], 0.30)
    grad_h = int(height * height_pct)
    alpha_max = gradient.get("alphaMax", 180)
    pos = gradient.get("position", "bottom")
    for y_step in range(grad_h):
        alpha = int(alpha_max * (y_step / grad_h))
        if pos == "top":
            y_pos = grad_h - y_step
        elif pos == "center":
            y_pos = (height // 2) - (grad_h // 2) + y_step
        else:
            y_pos = height - grad_h + y_step
        draw_ov.rectangle([(0, y_pos), (width, y_pos)], fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, overlay)

# --- Font loader ---
font_map = {
    "serif": ["/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
              "/System/Library/Fonts/Supplemental/Georgia.ttf"],
    "sans":  ["/System/Library/Fonts/Supplemental/Arial Bold.ttf",
              "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"],
    "helvetica": ["/System/Library/Fonts/Helvetica.ttc"],
}
def load_font(style, size):
    for fp in font_map.get(style, font_map["sans"]):
        if os.path.exists(fp):
            try: return ImageFont.truetype(fp, size)
            except: continue
    return ImageFont.load_default()

def hex_to_rgba(hex_color, opacity_pct):
    h = hex_color.lstrip("#")
    return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), int(255*opacity_pct/100))

draw = ImageDraw.Draw(img)

def render_text(cfg):
    text = cfg["text"]
    if not text.strip(): return
    font = load_font(cfg.get("fontFamily","sans"), cfg.get("fontSize",48))
    color = hex_to_rgba(cfg.get("color","#FFFFFF"), cfg.get("opacity",100))
    x, y, align = cfg["x"], cfg["y"], cfg.get("align","center")
    bbox = draw.textbbox((0,0), text, font=font)
    tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
    draw_x = x - tw//2 if align=="center" else (x - tw if align=="right" else x)
    draw_y = y - th//2
    shadow = (0, 0, 0, min(220, color[3]))
    for ox, oy in [(3,3),(-1,-1),(2,2),(0,3)]:
        draw.text((draw_x+ox, draw_y+oy), text, fill=shadow, font=font)
    draw.text((draw_x, draw_y), text, fill=color, font=font)

render_text(headline)
render_text(brand_cfg)

out_path = "/tmp/instagram_ad_edited.png"
img.convert("RGB").save(out_path, "PNG", quality=95)
```

Then: `mcp__tdx-studio__open_file(path="/tmp/instagram_ad_edited.png")`

---

## Data Prop Schema

```json
{
  "bgGradient": "CSS linear-gradient matching image colors",
  "headline": { "text": "str", "x": "px", "y": "px", "fontSize": "16-120",
                "fontFamily": "helvetica|serif|sans", "color": "#hex",
                "opacity": "0-100", "align": "left|center|right" },
  "brand":    { "text": "str", "x": "px", "y": "px", "fontSize": "16-120",
                "fontFamily": "helvetica|serif|sans", "color": "#hex",
                "opacity": "0-100", "align": "left|center|right" },
  "logo":     { "x": "px", "y": "px", "width": "40-200",
                "opacity": "0-100", "tint": "#hex|null", "variant": "auto|light|dark" },
  "gradient": { "style": "none|subtle|medium|heavy",
                "position": "top|center|bottom", "alphaMax": "0-255" }
}
```

**Pillow mapping**: `align:center` → `draw_x = x - tw//2`, `align:right` → `draw_x = x - tw`, `align:left` → `draw_x = x`. Logo `variant:auto` samples background luminance (WCAG formula) at logo position — dark (<128) uses light logo, light (>=128) uses dark logo. Gradient `style` maps to height: subtle=25%, medium=30%, heavy=40%.

---

## Integration with image-gen Skill

This editor works after the `image-gen` skill generates an image. Claude starts the clipboard poller, constructs the data prop from current overlay parameters, picks a bgGradient matching the image, and launches the editor. After "Apply Changes", the poller detects the config and Claude auto-applies via Pillow.

**Logo path resolution**: Claude resolves logo file paths from brand guidelines used in the current session. Search with Glob if paths aren't absolute. The Pillow applicator uses these paths directly (not embedded in the React component).
