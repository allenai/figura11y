import abc


class BaseModel(abc.ABC):
    """Base class for all PyTorch models we support.
    """
    def __init__(self, ckpt: str, device: str) -> None:
        self.ckpt = ckpt
        self.device = device

    @abc.abstractmethod
    def __call__(self, image_path: str, input_prompt: str, max_tokens: int = 1024) -> str:
        raise NotImplementedError("This method must be implemented in a subclass.")
