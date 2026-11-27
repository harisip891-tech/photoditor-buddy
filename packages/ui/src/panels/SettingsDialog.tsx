import { useState } from 'react';
import { CheckCircle2, ExternalLink, Eye, EyeOff, XCircle } from 'lucide-react';
import {
  GEMINI_MODELS,
  OPENAI_MODELS,
  looksLikeKey,
  verifyKey,
  type CloudProviderId,
} from '@photoditor-buddy/ai';
import { keyVault, useEditorStore } from '../store/editorStore';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Chip, ChipRow } from '../components/common/Chip';
import { Tabs } from '../components/common/Tabs';
import { Section, Hint } from '../components/common/Section';

const KEY_HELP: Record<CloudProviderId, { label: string; url: string; steps: string[] }> = {
  gemini: {
    label: 'Google Gemini',
    url: 'https://aistudio.google.com/apikey',
    steps: [
      'Open Google AI Studio and sign in with a Google account.',
      'Click "Create API key" and copy it (starts with AIza…).',
      'Image generation needs billing enabled on the Google Cloud project (no free tier for image models).',
    ],
  },
  openai: {
    label: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    steps: [
      'Open the OpenAI platform and sign in.',
      'Click "Create new secret key" and copy it (starts with sk-…).',
      'Add a payment method under Billing; image edits cost a few cents each.',
    ],
  },
};

/** API keys, model choices and app info. Keys are stored only in this browser. */
export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'keys' | 'models' | 'about'>('keys');
  return (
    <Modal open={open} title="Settings" onClose={onClose} wide>
      <Tabs
        tabs={[
          { id: 'keys', label: 'AI keys' },
          { id: 'models', label: 'Models & quality' },
          { id: 'about', label: 'About' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'keys' && (
        <div>
          <Hint>
            Bring your own key: each request goes straight from your browser to the provider.
            Nothing is sent to us. Keys are saved in this browser only.
          </Hint>
          <KeyField provider="gemini" />
          <KeyField provider="openai" />
          <Button
            size="sm"
            variant="danger"
            className="mt-2"
            onClick={() => {
              keyVault.clear();
              useEditorStore.setState({});
            }}
          >
            Remove all keys from this browser
          </Button>
        </div>
      )}
      {tab === 'models' && <ModelSettings />}
      {tab === 'about' && (
        <div className="text-sm leading-relaxed">
          <p className="mb-2">
            <strong>HashClick</strong>
          </p>
          <p>
            Your photos stay on your device during local editing. We never upload or store your
            photos on our servers.
          </p>
        </div>
      )}
    </Modal>
  );
}

function KeyField({ provider }: { provider: CloudProviderId }) {
  const help = KEY_HELP[provider];
  const [value, setValue] = useState(keyVault.get(provider));
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const toast = useEditorStore((s) => s.toast);
  const save = (): void => {
    keyVault.set(provider, value);
    useEditorStore.setState({});
    toast(
      value.trim() ? `${help.label} key saved on this device.` : `${help.label} key removed.`,
      'success',
    );
  };
  const test = async (): Promise<void> => {
    setTesting(true);
    const result = await verifyKey(provider, value.trim());
    setStatus(result);
    setTesting(false);
    if (result.ok) save();
  };
  return (
    <Section
      title={help.label}
      className="mt-3"
      right={
        <a
          className="text-xs text-accent inline-flex items-center gap-1"
          href={help.url}
          target="_blank"
          rel="noreferrer"
        >
          Get a key <ExternalLink size={12} />
        </a>
      }
    >
      <div className="flex gap-1">
        <input
          type={show ? 'text' : 'password'}
          className="flex-1 bg-surface-2 border border-border rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-accent font-mono"
          placeholder={provider === 'gemini' ? 'AIza…' : 'sk-…'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus(null);
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label={`${help.label} API key`}
          data-testid={`key-${provider}`}
        />
        <Button
          variant="ghost"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide key' : 'Show key'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
        <Button onClick={() => void test()} disabled={!value.trim() || testing}>
          {testing ? 'Testing…' : 'Test & save'}
        </Button>
        <Button variant="primary" onClick={save} data-testid={`save-key-${provider}`}>
          Save
        </Button>
      </div>
      {value && !looksLikeKey(provider, value) && (
        <div className="text-[11px] text-danger mt-1">
          This does not look like a {help.label} key.
        </div>
      )}
      {status && (
        <div
          className={`text-xs mt-1 inline-flex items-center gap-1 ${status.ok ? 'text-success' : 'text-danger'}`}
        >
          {status.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {status.message}
        </div>
      )}
      <ol className="text-xs text-muted list-decimal ml-4 mt-2 space-y-0.5">
        {help.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </Section>
  );
}

function ModelSettings() {
  const aiSettings = useEditorStore((s) => s.aiSettings);
  const setAiSettings = useEditorStore((s) => s.setAiSettings);
  return (
    <div>
      <Section title="Preferred provider for prompt tasks">
        <ChipRow>
          <Chip
            active={aiSettings.provider === 'gemini'}
            onClick={() => setAiSettings({ provider: 'gemini' })}
          >
            Gemini (cheaper, no mask)
          </Chip>
          <Chip
            active={aiSettings.provider === 'openai'}
            onClick={() => setAiSettings({ provider: 'openai' })}
          >
            OpenAI (exact masks)
          </Chip>
        </ChipRow>
        <Hint>
          Painted masks always go to OpenAI when you have an OpenAI key, because Gemini has no mask
          input.
        </Hint>
      </Section>
      <Section title="Gemini model">
        {GEMINI_MODELS.map((m) => (
          <label key={m.id} className="flex items-start gap-2 text-xs py-1">
            <input
              type="radio"
              name="gemini-model"
              checked={aiSettings.geminiModel === m.id}
              onChange={() => setAiSettings({ geminiModel: m.id })}
            />
            <span>
              <span className="text-text">{m.label}</span>
              <br />
              <span className="text-muted">{m.price}</span>
            </span>
          </label>
        ))}
      </Section>
      <Section title="OpenAI model">
        {OPENAI_MODELS.map((m) => (
          <label key={m.id} className="flex items-start gap-2 text-xs py-1">
            <input
              type="radio"
              name="openai-model"
              checked={aiSettings.openAiModel === m.id}
              onChange={() => setAiSettings({ openAiModel: m.id })}
            />
            <span>
              <span className="text-text">{m.label}</span>
              <br />
              <span className="text-muted">{m.price}</span>
            </span>
          </label>
        ))}
        <ChipRow className="mt-1">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <Chip
              key={q}
              active={aiSettings.openAiQuality === q}
              onClick={() => setAiSettings({ openAiQuality: q })}
            >
              {q[0]!.toUpperCase() + q.slice(1)} quality
            </Chip>
          ))}
        </ChipRow>
      </Section>
      <Section title="Free background removal model">
        <ChipRow>
          <Chip
            active={aiSettings.backgroundModel === 'portrait'}
            onClick={() => setAiSettings({ backgroundModel: 'portrait' })}
          >
            People (MODNet, ~25 MB)
          </Chip>
          <Chip
            active={aiSettings.backgroundModel === 'general'}
            onClick={() => setAiSettings({ backgroundModel: 'general' })}
          >
            Anything (BiRefNet, larger)
          </Chip>
        </ChipRow>
      </Section>
      <Section title="Upload size for cloud AI">
        <ChipRow>
          {[1024, 1536, 2048].map((n) => (
            <Chip
              key={n}
              active={aiSettings.uploadMaxEdge === n}
              onClick={() => setAiSettings({ uploadMaxEdge: n })}
            >
              {n}px
            </Chip>
          ))}
        </ChipRow>
        <Hint>
          Smaller uploads are faster on mobile data. The AI result is at the model's own resolution.
        </Hint>
      </Section>
    </div>
  );
}
