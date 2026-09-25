import os
import time
from typing import Optional, Generator, Dict, List
import anthropic
from openai import OpenAI
import google.generativeai as genai
from app.core.config import settings
from app.rag.prompts.system import DOCMIND_SYSTEM_INSTRUCTION
from app.core.logging import get_logger

logger = get_logger(__name__)

# Model matrix matching available Claude, OpenAI, and Gemini choices
AVAILABLE_MODELS: List[Dict[str, str]] = [
    # Anthropic Claude
    {
        "id": "claude-sonnet-5",
        "label": "Claude Sonnet 5",
        "provider": "anthropic",
        "badge": "Default · Best all-rounder",
        "description": "Balanced intelligence, speed, and long context understanding"
    },
    {
        "id": "claude-opus-5",
        "label": "Claude Opus 5",
        "provider": "anthropic",
        "badge": "Deep reasoning",
        "description": "Hardest reasoning, complex coding, and extensive document analysis"
    },
    {
        "id": "claude-haiku-4-5",
        "label": "Claude Haiku 4.5",
        "provider": "anthropic",
        "badge": "Fast & lightweight",
        "description": "Fastest response latency and high-throughput queries"
    },
    # OpenAI
    {
        "id": "gpt-5.6-terra",
        "label": "GPT-5.6 Terra",
        "provider": "openai",
        "badge": "Everyday use",
        "description": "High general capability and reliable domain reasoning"
    },
    {
        "id": "gpt-5.6-sol",
        "label": "GPT-5.6 Sol",
        "provider": "openai",
        "badge": "Flagship reasoning",
        "description": "Top-tier intelligence, advanced analysis, and code synthesis"
    },
    {
        "id": "gpt-5.6-luna",
        "label": "GPT-5.6 Luna",
        "provider": "openai",
        "badge": "Fast & low-latency",
        "description": "Speed-optimized for interactive and high-volume tasks"
    },
    # Google Gemini
    {
        "id": "gemini-3.6-flash",
        "label": "Gemini 3.6 Flash",
        "provider": "gemini",
        "badge": "High speed",
        "description": "Sub-second multi-modal understanding and document retrieval"
    },
    {
        "id": "gemini-3.1-pro-preview",
        "label": "Gemini 3.1 Pro Preview",
        "provider": "gemini",
        "badge": "Complex reasoning",
        "description": "Deeper reasoning on multi-page research documents"
    },
    {
        "id": "gemini-3.5-flash-lite",
        "label": "Gemini 3.5 Flash-Lite",
        "provider": "gemini",
        "badge": "Lightweight",
        "description": "Ultra-efficient for rapid Q&A"
    },
]

DEFAULT_MODEL_ID = "claude-sonnet-5"

# Active model mapping for actual provider API endpoints
ANTHROPIC_MODEL_MAP = {
    "claude-sonnet-5": "claude-3-7-sonnet-20250219",
    "claude-opus-5": "claude-3-opus-20240229",
    "claude-haiku-4-5": "claude-3-5-haiku-20241022",
    "claude-3-7-sonnet": "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-haiku": "claude-3-5-haiku-20241022",
}

OPENAI_MODEL_MAP = {
    "gpt-5.6-terra": "gpt-4o",
    "gpt-5.6-sol": "gpt-4o",
    "gpt-5.6-luna": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
}

GEMINI_MODEL_MAP = {
    "gemini-3.6-flash": "gemini-1.5-flash",
    "gemini-3.1-pro-preview": "gemini-1.5-pro",
    "gemini-3.5-flash-lite": "gemini-1.5-flash-8b",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
}


class MultiLLMRouter:
    """Production-grade AI Router dispatching across Claude, OpenAI, and Gemini.
    
    Supports native SDK streaming, multi-turn message history, and clear error reporting.
    """

    def __init__(self):
        # 1. Anthropic Client
        self.anthropic_client: Optional[anthropic.Anthropic] = None
        self.anthropic_api_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", "")
        if self.anthropic_api_key:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
                logger.info("[LLMRouter] Anthropic Claude client initialized successfully.")
            except Exception as e:
                logger.error(f"[LLMRouter] Failed to initialize Anthropic client: {e}")

        # 2. OpenAI Client
        self.openai_client: Optional[OpenAI] = None
        self.openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        if self.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_api_key)
                logger.info("[LLMRouter] OpenAI client initialized successfully.")
            except Exception as e:
                logger.error(f"[LLMRouter] Failed to initialize OpenAI client: {e}")

        # 3. Google Gemini Client
        self.gemini_configured: bool = False
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_configured = True
                logger.info("[LLMRouter] Google Gemini configured successfully.")
            except Exception as e:
                logger.error(f"[LLMRouter] Failed to configure Gemini API: {e}")

        self.max_retries = settings.LLM_MAX_RETRIES
        self.retry_delay = settings.LLM_RETRY_DELAY

    def generate_response(
        self,
        prompt: str,
        system_instruction: str = DOCMIND_SYSTEM_INSTRUCTION,
        model_provider: Optional[str] = None,
        model_name: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Execute synchronous model completion with multi-turn history support."""
        start_time = time.time()
        target_provider, target_model = self._resolve_provider_and_model(model_provider, model_name)

        logger.info(f"[LLMRouter] Generating response using provider='{target_provider}', model='{target_model}'")

        formatted_messages = self._build_messages_payload(prompt, messages)

        if target_provider == "anthropic":
            response_text = self._call_anthropic(formatted_messages, system_instruction, target_model)
        elif target_provider == "openai":
            response_text = self._call_openai(formatted_messages, system_instruction, target_model)
        elif target_provider == "gemini":
            response_text = self._call_gemini(formatted_messages, system_instruction, target_model)
        else:
            raise ValueError(f"Unsupported provider: '{target_provider}'")

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"\n========================\n"
            f"LLM ROUTER\n"
            f"Provider: {target_provider}\n"
            f"Model: {target_model}\n"
            f"Time: {elapsed_ms}ms\n"
            f"Response Length: {len(response_text)} chars\n"
            f"========================"
        )

        return response_text.strip()

    def generate_response_stream(
        self,
        prompt: str,
        system_instruction: str = DOCMIND_SYSTEM_INSTRUCTION,
        model_provider: Optional[str] = None,
        model_name: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None
    ) -> Generator[str, None, None]:
        """Stream AI response tokens in real-time across Claude, OpenAI, and Gemini."""
        target_provider, target_model = self._resolve_provider_and_model(model_provider, model_name)
        logger.info(f"[LLMRouter] Streaming response using provider='{target_provider}', model='{target_model}'")

        formatted_messages = self._build_messages_payload(prompt, messages)

        # 1. Anthropic Stream
        if target_provider == "anthropic":
            for token in self._stream_anthropic(formatted_messages, system_instruction, target_model):
                yield token
            return

        # 2. OpenAI Stream
        if target_provider == "openai":
            for token in self._stream_openai(formatted_messages, system_instruction, target_model):
                yield token
            return

        # 3. Gemini Stream
        if target_provider == "gemini":
            for token in self._stream_gemini(formatted_messages, system_instruction, target_model):
                yield token
            return

        raise ValueError(f"Unsupported provider: '{target_provider}'")

    def _resolve_provider_and_model(
        self, requested_provider: Optional[str], requested_model: Optional[str]
    ) -> tuple[str, str]:
        """Resolve target provider and model ID from request parameters."""
        # 1. Check exact match in AVAILABLE_MODELS
        if requested_model:
            for m in AVAILABLE_MODELS:
                if m["id"] == requested_model:
                    return (m["provider"], m["id"])

        # 2. If provider explicitly specified
        if requested_provider:
            prov = requested_provider.lower().strip()
            if prov in ["anthropic", "claude"]:
                return ("anthropic", requested_model or "claude-sonnet-5")
            elif prov in ["openai", "chatgpt"]:
                return ("openai", requested_model or "gpt-5.6-terra")
            elif prov in ["gemini", "google"]:
                return ("gemini", requested_model or "gemini-3.6-flash")

        # 3. Default fallback based on available API keys
        if self.anthropic_client or self.anthropic_api_key:
            return ("anthropic", DEFAULT_MODEL_ID)
        elif self.openai_client or self.openai_api_key:
            return ("openai", "gpt-5.6-terra")
        elif self.gemini_configured or self.gemini_api_key:
            return ("gemini", "gemini-3.6-flash")

        return ("anthropic", DEFAULT_MODEL_ID)

    def _build_messages_payload(
        self, prompt: str, history: Optional[List[Dict[str, str]]] = None
    ) -> List[Dict[str, str]]:
        """Construct multi-turn conversation messages list."""
        messages: List[Dict[str, str]] = []
        if history:
            for h in history:
                role = h.get("role", "user")
                content = h.get("content", "").strip()
                if content and role in ["user", "assistant"]:
                    messages.append({"role": role, "content": content})

        # Append current turn as final user message if not already included
        if not messages or messages[-1]["content"] != prompt:
            messages.append({"role": "user", "content": prompt})

        return messages

    # --- Anthropic Claude Implementation ---

    def _get_anthropic_client(self) -> anthropic.Anthropic:
        """Get or lazily instantiate Anthropic client."""
        if not self.anthropic_client:
            key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", "")
            if not key:
                raise RuntimeError(
                    "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your environment or backend/.env file."
                )
            self.anthropic_client = anthropic.Anthropic(api_key=key)
        return self.anthropic_client

    def _call_anthropic(
        self, messages: List[Dict[str, str]], system_instruction: str, model_id: str
    ) -> str:
        """Call Anthropic Claude API using official SDK."""
        client = self._get_anthropic_client()
        active_model = ANTHROPIC_MODEL_MAP.get(model_id, "claude-3-5-sonnet-20241022")

        try:
            message = client.messages.create(
                model=active_model,
                max_tokens=settings.LLM_MAX_TOKENS,
                system=system_instruction,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE
            )
            if message.content and len(message.content) > 0:
                return message.content[0].text
            return ""
        except Exception as e:
            # Fallback to claude-3-5-sonnet-20241022 if model name not recognized
            if "not_found" in str(e).lower() and active_model != "claude-3-5-sonnet-20241022":
                logger.warning(f"[LLMRouter] Retrying Anthropic with fallback model 'claude-3-5-sonnet-20241022': {e}")
                message = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=settings.LLM_MAX_TOKENS,
                    system=system_instruction,
                    messages=messages,
                    temperature=settings.LLM_TEMPERATURE
                )
                return message.content[0].text if message.content else ""
            logger.error(f"[LLMRouter] Anthropic API call error: {e}", exc_info=True)
            raise RuntimeError(f"Anthropic API error: {e}")

    def _stream_anthropic(
        self, messages: List[Dict[str, str]], system_instruction: str, model_id: str
    ) -> Generator[str, None, None]:
        """Stream Anthropic Claude API using official SDK stream context manager."""
        client = self._get_anthropic_client()
        active_model = ANTHROPIC_MODEL_MAP.get(model_id, "claude-3-5-sonnet-20241022")

        try:
            with client.messages.stream(
                model=active_model,
                max_tokens=settings.LLM_MAX_TOKENS,
                system=system_instruction,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE
            ) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            # Try fallback model if model ID not found
            if "not_found" in str(e).lower() and active_model != "claude-3-5-sonnet-20241022":
                logger.warning(f"[LLMRouter] Retrying Anthropic stream with fallback model: {e}")
                with client.messages.stream(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=settings.LLM_MAX_TOKENS,
                    system=system_instruction,
                    messages=messages,
                    temperature=settings.LLM_TEMPERATURE
                ) as stream:
                    for text in stream.text_stream:
                        yield text
            else:
                logger.error(f"[LLMRouter] Anthropic streaming error: {e}", exc_info=True)
                raise RuntimeError(f"Anthropic streaming error: {e}")

    # --- OpenAI ChatGPT Implementation ---

    def _get_openai_client(self) -> OpenAI:
        """Get or lazily instantiate OpenAI client."""
        if not self.openai_client:
            key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
            if not key:
                raise RuntimeError(
                    "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment or backend/.env file."
                )
            self.openai_client = OpenAI(api_key=key)
        return self.openai_client

    def _call_openai(
        self, messages: List[Dict[str, str]], system_instruction: str, model_id: str
    ) -> str:
        """Call OpenAI ChatGPT API."""
        client = self._get_openai_client()
        active_model = OPENAI_MODEL_MAP.get(model_id, "gpt-4o")

        openai_messages = [{"role": "system", "content": system_instruction}] + messages

        try:
            response = client.chat.completions.create(
                model=active_model,
                messages=openai_messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS
            )
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
            return ""
        except Exception as e:
            logger.error(f"[LLMRouter] OpenAI API call error: {e}", exc_info=True)
            raise RuntimeError(f"OpenAI API error: {e}")

    def _stream_openai(
        self, messages: List[Dict[str, str]], system_instruction: str, model_id: str
    ) -> Generator[str, None, None]:
        """Stream OpenAI ChatGPT API response tokens."""
        client = self._get_openai_client()
        active_model = OPENAI_MODEL_MAP.get(model_id, "gpt-4o")

        openai_messages = [{"role": "system", "content": system_instruction}] + messages

        try:
            stream = client.chat.completions.create(
                model=active_model,
                messages=openai_messages,
                stream=True,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"[LLMRouter] OpenAI streaming error: {e}", exc_info=True)
            raise RuntimeError(f"OpenAI streaming error: {e}")

    # --- Google Gemini Implementation ---

    def _ensure_gemini_configured(self):
        """Ensure Gemini is configured with valid API key."""
        if not self.gemini_configured:
            key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
            if not key:
                raise RuntimeError(
                    "Google Gemini API key is not configured. Please set GEMINI_API_KEY in your environment or backend/.env file."
                )
            genai.configure(api_key=key)
            self.gemini_configured = True

    def _call_gemini(
        self, messages: List[Dict[str, str]], system_instruction: str, model_id: str
    ) -> str:
        """Call Google Gemini API with system instructions and multi-turn history."""
        self._ensure_gemini_configured()
        active_model = GEMINI_MODEL_MAP.get(model_id, "gemini-1.5-flash")

        try:
            model = genai.GenerativeModel(
                model_name=active_model,
                system_instruction=system_instruction
            )

            # Separate previous conversation history and final prompt
            if len(messages) > 1:
                history = []
                for m in messages[:-1]:
                    role = "user" if m["role"] == "user" else "model"
                    history.append({"role": role, "parts": [m["content"]]})
                chat = model.start_chat(history=history)
                response = chat.send_message(messages[-1]["content"])
            else:
                response = model.generate_content(messages[-1]["content"])

            if response and response.text:
                return response.text
            return ""
        except Exception as e:
            logger.error(f"[LLMRouter] Gemini API call error: {e}", exc_info=True)
            raise RuntimeError(f"Gemini API error: {e}")

    def _stream_gemini(
        self, messages: List[Dict[str, str]], system_instruction: str, model_id: str
    ) -> Generator[str, None, None]:
        """Stream Google Gemini API response tokens."""
        self._ensure_gemini_configured()
        active_model = GEMINI_MODEL_MAP.get(model_id, "gemini-1.5-flash")

        try:
            model = genai.GenerativeModel(
                model_name=active_model,
                system_instruction=system_instruction
            )

            if len(messages) > 1:
                history = []
                for m in messages[:-1]:
                    role = "user" if m["role"] == "user" else "model"
                    history.append({"role": role, "parts": [m["content"]]})
                chat = model.start_chat(history=history)
                response = chat.send_message(messages[-1]["content"], stream=True)
            else:
                response = model.generate_content(messages[-1]["content"], stream=True)

            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"[LLMRouter] Gemini streaming error: {e}", exc_info=True)
            raise RuntimeError(f"Gemini streaming error: {e}")

llm_router_service = MultiLLMRouter()
