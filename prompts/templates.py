"""6类东南亚风格电商提示词模板 v2.0

每类模板由骨架+变量组成，VisionAnalyzer识图后的结果注入变量生成最终提示词。
核心改进：
1. 所有提示词加入强产品一致性约束，确保生图与原产品一致
2. 更具体的东南亚电商场景描述
3. 更丰富的材质/工艺/细节描述注入

所有提示词为英文（TK跨境东南亚Listing标准）。
"""

from typing import Dict


# ============================================================
# 6类提示词模板 - 东南亚TK电商风格 v2.0
# ============================================================

PROMPT_TEMPLATES = {
    "主图": {
        "name_en": "main_product",
        "description_zh": "产品主图 - 白底/暖色渐变底，产品居中，专业干净",
        "description_en": "Main product photo - clean centered product on warm gradient background",
        "template": (
            "Professional e-commerce product photography of a {product_type}. "
            "The exact product is: {material} with {color} finish, {style} design, featuring {key_features_short}. "
            "{detail_sentence} "
            "CRITICAL PRODUCT CONSISTENCY: The product must look exactly as described — same shape, proportions, material texture, and color. "
            "Clean centered composition on a soft warm gradient background ({bg_color} tones transitioning to lighter shades). "
            "Studio lighting with soft diffused shadows, high resolution, sharp focus on product edges. "
            "No text overlay, no watermarks, no decorative elements. "
            "Suitable for TikTok Shop Southeast Asia listing, professional product shot style. "
            "Warm color palette matching Thai and Vietnamese market aesthetics."
        ),
    },
    "场景图": {
        "name_en": "lifestyle_scene",
        "description_zh": "使用场景图 - 产品在东南亚日常生活场景中被使用",
        "description_en": "Lifestyle scene - product being used in Southeast Asian daily life setting",
        "template": (
            "Lifestyle photography of a {product_type} being worn in a casual Southeast Asian setting. "
            "The exact product is: {material} with {color} finish, {style} design, featuring {key_features_short}. "
            "CRITICAL PRODUCT CONSISTENCY: The product must be clearly visible and look exactly as described — same material, color, and design details. "
            "A young {model_ethnicity} Southeast Asian woman wearing the {product_type} while {activity} at {scene_description}. "
            "Natural warm golden hour lighting, tropical ambiance with lush green plants and warm-toned wooden decor. "
            "Candid relaxed pose, authentic daily life moment, soft bokeh background with warm earthy tones. "
            "The {product_type} is prominently featured and in sharp focus. "
            "TikTok Shop suitable lifestyle shot, Southeast Asian market aesthetic, {style_touch}."
        ),
    },
    "细节图": {
        "name_en": "detail_closeup",
        "description_zh": "细节特写图 - 放大展示材质、工艺、关键特征",
        "description_en": "Detail close-up - macro shot showing material, craftsmanship, key features",
        "template": (
            "Extreme macro close-up photography of a {product_type} highlighting fine details. "
            "The exact product is: {material} with {color} finish, {style} design. "
            "Focus on: {detail_feature_highlight}. "
            "Show the {material_texture} texture and {craftsmanship} craftsmanship in extreme detail. "
            "CRITICAL PRODUCT CONSISTENCY: Every detail must match the real product exactly — same surface finish, same engraving patterns, same proportions. "
            "Shallow depth of field with the focal point on the most intricate detail. "
            "Professional studio lighting from the side revealing surface quality and reflections. "
            "Warm neutral background (#F5F0E8), high resolution, no text overlay. "
            "Product detail e-commerce photography style, quality assurance visual proof."
        ),
    },
    "参数图": {
        "name_en": "spec_infographic",
        "description_zh": "参数规格图 - 可视化展示尺寸、材质、重量等规格信息",
        "description_en": "Specification infographic - visualized size, material, weight specs",
        "template": (
            "Professional product specification infographic image for a {product_type}. "
            "The exact product shown in the center is: {material} with {color} finish, {style} design. "
            "CRITICAL PRODUCT CONSISTENCY: The product image in the center must be the exact same product. "
            "Clean modern card layout design with rounded corners. "
            "Specifications displayed with icons and clear labels: "
            "Material — {material_display}; "
            "Size — {size_display}; "
            "Color — {color_display}; "
            "Weight — {weight_display}. "
            "Warm color scheme with {bg_color} accent tones, easy-to-read typography. "
            "E-commerce product specification card style, clean minimal design, no clutter. "
            "Southeast Asian market friendly layout, TikTok Shop listing suitable."
        ),
    },
    "对比图": {
        "name_en": "comparison",
        "description_zh": "对比图 - 与普通款对比，突出差异化卖点",
        "description_en": "Comparison - premium vs ordinary, highlighting differentiation",
        "template": (
            "Side-by-side comparison product image showing {product_type} quality difference. "
            "The exact premium product on the left is: {material} with {color} finish, featuring {key_features_short}. "
            "CRITICAL PRODUCT CONSISTENCY: The left product must match the exact real product in every detail. "
            "Left side — Premium Quality: {premium_features}, smooth refined surface, precise details, durable {material} construction. "
            "Right side — Ordinary Version: {ordinary_features}, basic construction, rougher finish. "
            "Clear visual contrast highlighting {key_differentiator}. "
            "Professional e-commerce comparison layout, warm studio lighting, clean split-screen design. "
            "Southeast Asian market value proposition style, warm color palette."
        ),
    },
    "模特图": {
        "name_en": "model_wearing",
        "description_zh": "模特佩戴图 - 东南亚面孔模特自然佩戴展示",
        "description_en": "Model wearing - Southeast Asian ethnicity model naturally wearing the product",
        "template": (
            "Professional e-commerce model photography featuring a {model_ethnicity} Southeast Asian young woman. "
            "She is wearing the exact {product_type}: {material} with {color} finish, {style} design, featuring {key_features_short}. "
            "CRITICAL PRODUCT CONSISTENCY: The {product_type} must look exactly like the real product — same design, same material sheen, same proportions. "
            "{pose_description}. {expression_description}. "
            "Natural warm golden hour lighting, soft glow on skin. "
            "{setting_description}. {outfit_description}. "
            "The {product_type} is clearly visible, in sharp focus, and highlighted by the lighting. "
            "Lifestyle e-commerce photography style, TikTok Shop suitable, high quality. "
            "Warm skin tones, natural makeup, authentic Southeast Asian beauty aesthetic, no text overlay."
        ),
    },
}


# ============================================================
# 变量填充函数
# ============================================================

def fill_template(template: str, analysis: dict) -> str:
    """
    将识图分析结果注入提示词模板变量
    """
    variables = _build_variables(analysis)
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{key}}}", value)
    result = _clean_unfilled(result)
    return result


def generate_all_prompts(analysis: dict) -> Dict[str, dict]:
    """
    为6类图片分别生成完整提示词
    """
    results = {}
    for category, template_info in PROMPT_TEMPLATES.items():
        prompt = fill_template(template_info["template"], analysis)
        results[category] = {
            "name_en": template_info["name_en"],
            "description_zh": template_info["description_zh"],
            "prompt": prompt,
        }
    return results


def _build_variables(analysis: dict) -> dict:
    """从分析结果构建模板变量字典"""

    # 基本信息
    product_type = analysis.get("product_type", "product")
    product_type_en = analysis.get("product_name_en", product_type)
    material = analysis.get("material", "quality material")
    color = analysis.get("color", "silver")
    color_secondary = analysis.get("color_secondary", "")
    style = analysis.get("style", "elegant")
    key_features = analysis.get("key_features", ["quality", "durable", "beautiful"])

    # 东南亚特有
    bg_color = analysis.get("bg_color_suggestion", "#F5E6D3 warm peach")
    model_ethnicity = analysis.get("model_ethnicity", "Thai/Vietnamese-looking")
    scenes = analysis.get("scene_suggestions", ["cozy cafe", "tropical garden", "urban street"])
    cultural_notes = analysis.get("cultural_notes_sea", "")

    # 细节信息
    detail_features = analysis.get("detail_features", "fine craftsmanship")
    size_info = analysis.get("size_info", "standard size")
    weight_info = analysis.get("weight_info", "lightweight")

    # key_features 处理
    if isinstance(key_features, str):
        key_features = [f.strip() for f in key_features.split(",") if f.strip()]
    if not key_features:
        key_features = ["quality design", "premium material", "elegant look"]

    # 构建关键特征短描述（用于一致性约束）
    key_features_short = _features_to_short(key_features)
    detail_sentence = _build_detail_sentence(detail_features, material, color)

    variables = {
        # 通用
        "product_type": product_type_en,
        "material": material,
        "color": color,
        "color_secondary": color_secondary if color_secondary else color,
        "style": style,
        "bg_color": bg_color,
        "model_ethnicity": model_ethnicity,
        "key_features_short": key_features_short,
        "detail_sentence": detail_sentence,

        # 场景图变量
        "scene_description": scenes[0] if len(scenes) > 0 else "a cozy cafe with warm lighting",
        "activity": _get_activity(product_type),
        "style_touch": f"{style} style with {cultural_notes}" if cultural_notes else f"{style} style aesthetic",

        # 细节图变量
        "detail_feature_highlight": detail_features,
        "material_texture": _get_material_texture(material),
        "craftsmanship": "precision crafted" if "银" in material or "silver" in material.lower() or "金" in material or "gold" in material.lower() else "handcrafted",

        # 参数图变量
        "material_display": material,
        "size_display": size_info,
        "color_display": f"{color}" + (f" / {color_secondary}" if color_secondary else ""),
        "weight_display": weight_info,

        # 对比图变量
        "premium_features": f"{material} construction, {key_features[0] if key_features else 'refined finish'}, {color} finish",
        "ordinary_features": "basic alloy material, simple generic design, plain dull finish",
        "key_differentiator": f"{key_features[0] if key_features else 'premium quality'} and genuine {material} material",

        # 模特图变量
        "pose_description": _get_pose(product_type),
        "expression_description": "confident relaxed smile with natural warm expression, looking slightly to the side",
        "setting_description": _get_setting(scenes),
        "outfit_description": _get_outfit(style),
    }

    return variables


def _features_to_short(features: list) -> str:
    """将特征列表转换为简短视觉描述"""
    if not features:
        return "elegant design"
    return ", ".join(features[:3])


def _build_detail_sentence(detail_features: str, material: str, color: str) -> str:
    """构建细节描述句"""
    if detail_features and detail_features != "未知":
        return f"Key details: {detail_features}. "
    return f"Clean {material} construction with {color} finish. "


def _get_material_texture(material: str) -> str:
    """根据材质返回纹理描述"""
    material = material.lower()
    if "银" in material or "silver" in material:
        return "smooth polished silver with subtle reflective grain"
    if "金" in material or "gold" in material:
        return "lustrous gold with warm reflective surface"
    if "不锈钢" in material or "steel" in material:
        return "brushed metallic steel with cool gray undertone"
    if "珍珠" in material or "pearl" in material:
        return "soft organic pearl with gentle iridescent luster"
    if "水晶" in material or "crystal" in material:
        return "faceted crystal with prismatic light refraction"
    return f"fine {material} texture with natural surface detail"


def _get_activity(product_type: str) -> str:
    """根据产品类型推断使用场景活动"""
    activities = {
        "项链": "sipping iced coffee at an outdoor cafe",
        "戒指": "elegantly holding a ceramic cup",
        "手链": "casually resting her arm on a wooden table",
        "耳环": "turning her head with a gentle smile",
        "胸针": "adjusting her collar gracefully",
        "脚链": "sitting with legs crossed at the beach",
    }
    en_activities = {
        "necklace": "sipping iced coffee at an outdoor cafe",
        "ring": "elegantly holding a ceramic cup",
        "bracelet": "casually resting her arm on a wooden table",
        "earring": "turning her head with a gentle smile",
        "brooch": "adjusting her collar gracefully",
        "anklet": "sitting with legs crossed at the beach",
    }
    return activities.get(product_type, en_activities.get(product_type.lower(), "enjoying a relaxed daily moment"))


def _get_pose(product_type: str) -> str:
    """根据产品类型推断模特姿势"""
    poses = {
        "项链": "Head slightly tilted to showcase the necklace resting perfectly at the collarbone",
        "戒指": "Hand elegantly raised near her face with fingers naturally extended, ring clearly visible",
        "手链": "Arm relaxed on the table with the bracelet visible on her wrist, palm slightly open",
        "耳环": "Face turned three-quarters to show the ear profile, earrings catching the light",
        "胸针": "Standing with one hand lightly touching the brooch area on her chest",
        "脚链": "Sitting casually with one ankle crossed over the other, foot jewelry visible",
    }
    en_poses = {
        "necklace": "Head slightly tilted to showcase the necklace resting perfectly at the collarbone",
        "ring": "Hand elegantly raised near her face with fingers naturally extended, ring clearly visible",
        "bracelet": "Arm relaxed on the table with the bracelet visible on her wrist, palm slightly open",
        "earring": "Face turned three-quarters to show the ear profile, earrings catching the light",
        "brooch": "Standing with one hand lightly touching the brooch area on her chest",
        "anklet": "Sitting casually with one ankle crossed over the other, foot jewelry visible",
    }
    return poses.get(product_type, en_poses.get(product_type.lower(), "Product prominently featured in a natural pose"))


def _get_setting(scenes: list) -> str:
    """根据场景建议返回完整场景描述"""
    if not scenes:
        return "In a warm-toned minimalist cafe with tropical monstera plants and natural rattan furniture"
    scene = scenes[0]
    if "咖啡" in scene or "cafe" in scene.lower():
        return "In a warm-toned minimalist cafe with tropical monstera plants, natural rattan furniture, and soft ambient lighting"
    if "花园" in scene or "garden" in scene.lower():
        return "In a lush tropical garden with palm fronds, bougainvillea flowers, and warm dappled sunlight"
    if "海滩" in scene or "beach" in scene.lower():
        return "At a tropical beach during golden hour with soft sand, gentle waves, and warm sunset tones"
    if "街" in scene or "street" in scene.lower():
        return "On a vibrant Southeast Asian street with warm lanterns, colorful storefronts, and bustling energy"
    return f"In a {scene} with warm Southeast Asian ambiance and natural lighting"


def _get_outfit(style: str) -> str:
    """根据风格推断模特穿搭"""
    outfits = {
        "简约": "simple white linen camisole top with minimal accessories",
        "复古": "vintage-inspired cream blouse with delicate lace collar",
        "波西米亚": "flowy bohemian off-shoulder dress with subtle floral embroidery",
        "优雅": "silk blouse in warm champagne beige with pearl stud earrings",
        "minimalist": "simple white linen camisole top with minimal accessories",
        "vintage": "vintage-inspired cream blouse with delicate lace collar",
        "boho": "flowy bohemian off-shoulder dress with subtle floral embroidery",
        "elegant": "silk blouse in warm champagne beige with pearl stud earrings",
        "甜美": "soft pink cotton top with a subtle bow detail at the neckline",
        "cool": "sleek black fitted top with modern geometric silver earrings",
        "casual": "relaxed beige linen shirt with sleeves casually rolled up",
    }
    return outfits.get(style, "casual stylish top in warm neutral earth tones, no competing jewelry")


def _clean_unfilled(text: str) -> str:
    """清理未填充的模板占位符"""
    import re
    text = re.sub(r"\{[^}]+\}", "", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text
