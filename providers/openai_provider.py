"""OpenAI生图Provider - 支持gpt-image-1、gpt-image-2和dall-e-3，支持自定义base_url"""

import os
import base64
import httpx
from pathlib import Path
from typing import Optional

from openai import AsyncOpenAI

from .base import ImageProvider


class OpenAIProvider(ImageProvider):
    """OpenAI图片生成Provider — 支持自定义API代理"""

    def __init__(self, config: dict):
        self.api_key = config.get("api_key", "")
        self.model = config.get("image_model", "gpt-image-1")
        self.default_size = config.get("image_size", "1024x1024")
        self.default_quality = config.get("image_quality", "high")

        # 支持自定义base_url（第三方API代理）
        base_url = config.get("base_url")
        client_kwargs = {"api_key": self.api_key}
        if base_url:
            base_url = base_url.rstrip("/")
            if not base_url.endswith("/v1"):
                base_url = base_url + "/v1"
            client_kwargs["base_url"] = base_url

        self.client = AsyncOpenAI(**client_kwargs)
        self.base_url = base_url or "https://api.openai.com/v1"

    def get_model_name(self) -> str:
        return self.model

    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "high",
        n: int = 1,
    ) -> list[str]:
        """
        使用OpenAI API生成图片

        gpt-image-1/2: 使用images.generate() API，返回base64数据
        dall-e-3: 使用images/generations API，返回URL
        """
        if self.model.startswith("gpt-image"):
            return await self._generate_with_gpt_image(prompt, size, quality, n)
        else:
            # dall-e-3 及其他旧模型
            return await self._generate_with_dalle(prompt, size, quality, n)

    async def _generate_with_gpt_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "high",
        n: int = 1,
    ) -> list[str]:
        """使用gpt-image-1/2模型生成图片（images.generate API）"""

        response = await self.client.images.generate(
            model=self.model,
            prompt=prompt,
            n=n,
            size=size,
            quality=quality,
            response_format="b64_json",
        )

        results = []
        for img_data in response.data:
            # b64_json格式: 直接返回base64编码的PNG数据
            b64_str = img_data.b64_json
            # 将base64数据封装为data URL格式，方便后续download_image统一处理
            data_url = f"data:image/png;base64,{b64_str}"
            results.append(data_url)

        return results

    async def _generate_with_dalle(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "high",
        n: int = 1,
    ) -> list[str]:
        """使用DALL-E 3模型生成图片（传统images API，返回URL）"""

        response = await self.client.images.generate(
            model=self.model,
            prompt=prompt,
            size=size,
            quality=quality,
            n=n,
            response_format="url",
        )

        return [img.url for img in response.data]

    async def generate_with_reference(
        self,
        prompt: str,
        reference_image_path: str,
        size: str = "1024x1024",
        quality: str = "high",
        n: int = 1,
    ) -> list[str]:
        """
        使用参考图生成图片，保持产品一致性。
        优先尝试 images.edit（gpt-image-1支持），fallback到普通生成。
        """
        if not self.model.startswith("gpt-image"):
            # 非gpt-image模型不支持edit，fallback
            raise NotImplementedError("当前模型不支持参考图生成")

        # 读取参考图片
        with open(reference_image_path, "rb") as img_file:
            image_bytes = img_file.read()

        # 使用 images.edit API 传入参考图
        # 注意：images.edit 需要 image 参数，prompt 描述想要的输出
        response = await self.client.images.edit(
            model=self.model,
            image=image_bytes,
            prompt=prompt,
            n=n,
            size=size,
            quality=quality,
            response_format="b64_json",
        )

        results = []
        for img_data in response.data:
            b64_str = img_data.b64_json
            data_url = f"data:image/png;base64,{b64_str}"
            results.append(data_url)

        return results

    async def download_image(self, image_url: str, save_path: str) -> str:
        """
        下载/保存生成的图片到本地

        支持两种格式:
        - data:image/png;base64,... → base64解码直接保存
        - https://... → HTTP下载保存
        """
        save_path = str(save_path)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        if image_url.startswith("data:"):
            # base64数据直接解码保存
            header, data = image_url.split(",", 1)
            image_bytes = base64.b64decode(data)
            with open(save_path, "wb") as f:
                f.write(image_bytes)
        else:
            # URL下载
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.get(image_url)
                with open(save_path, "wb") as f:
                    f.write(resp.content)

        return save_path
