"""生图API Provider抽象基类 - 支持多Provider可切换"""

from abc import ABC, abstractmethod
from typing import Optional


class ImageProvider(ABC):
    """所有生图Provider必须实现此接口"""

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "high",
        n: int = 1,
    ) -> list[str]:
        """
        根据提示词生成图片

        Args:
            prompt: 英文提示词
            size: 图片尺寸，如 "1024x1024"
            quality: 图片质量 high/medium/low
            n: 生成数量

        Returns:
            生成的图片URL列表或本地路径列表
        """
        pass

    @abstractmethod
    async def download_image(self, image_url: str, save_path: str) -> str:
        """
        下载生成的图片到本地

        Args:
            image_url: 图片URL
            save_path: 本地保存路径

        Returns:
            本地文件路径
        """
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """返回当前使用的模型名称"""
        pass


def get_provider(provider_name: str, config: dict) -> ImageProvider:
    """根据配置获取对应的Provider实例"""
    if provider_name == "openai":
        from .openai_provider import OpenAIProvider
        return OpenAIProvider(config)
    # 预留其他Provider
    # elif provider_name == "replicate":
    #     from .replicate_provider import ReplicateProvider
    #     return ReplicateProvider(config)
    # elif provider_name == "stability":
    #     from .stability_provider import StabilityProvider
    #     return StabilityProvider(config)
    else:
        raise ValueError(f"未支持的Provider: {provider_name}，目前支持: openai")
