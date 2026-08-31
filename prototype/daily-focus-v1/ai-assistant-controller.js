/* FocusWave AI reflection adapter v1.
 * AI stays downstream from structured measurement. This prototype exposes
 * consent, generation states and provenance without claiming a live provider.
 */
(() => {
  const MODE_KEY = 'focuswave.aiMode';
  const MODES = [
    { value: 'off', label: '关闭' },
    { value: 'reflection', label: '会话回顾' },
    { value: 'guidance', label: '回顾 + 建议' },
  ];
  const CONTENT_DRAFTS = [
    { text:'水面恢复同一方向，下一行也重新变得清楚。', theme:'ocean', state:'refocus' },
    { text:'远浪保持自己的节拍，你只需要完成眼前这一拍。', theme:'ocean', state:'stable' },
    { text:'云影暂时越过峰线，你已经察觉到目光的移动。', theme:'mountain', state:'drift' },
    { text:'最近的一道山脊先显现出来，从这里重新开始。', theme:'mountain', state:'refocus' },
    { text:'烟线细而连贯，手边的节奏也没有中断。', theme:'incense', state:'stable' },
    { text:'散开的烟留下许多方向，先不急着追随任何一条。', theme:'incense', state:'dispersed' },
    { text:'暮色收回窗边，注意也回到桌面中央。', theme:'dusk', state:'refocus' },
    { text:'余光分成许多细片，你看见思绪也正在外散。', theme:'dusk', state:'dispersed' },
    { text:'一小段潮声带走了目光，岸线仍然留在近处。', theme:'ocean', state:'drift' },
    { text:'雾气同时遮住几层山色，注意暂时失去了远近。', theme:'mountain', state:'dispersed' },
    { text:'烟身轻轻转弯，思路也偏离了原来的位置。', theme:'incense', state:'drift' },
    { text:'晚风没有打断这一段连续的光。', theme:'dusk', state:'stable' }
  ];

  function mode() {
    const value = localStorage.getItem(MODE_KEY) || 'reflection';
    return MODES.some((item) => item.value === value) ? value : 'reflection';
  }

  function selectMode(value) {
    localStorage.setItem(MODE_KEY, value);
    document.querySelectorAll('[data-ai-mode]').forEach((button) => {
      const selected = button.dataset.aiMode === value;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    syncSummaryAvailability();
  }

  function summaryPayload() {
    return {
      task: document.querySelector('#liveTask')?.textContent?.trim() || '阅读论文',
      duration_minutes: Number.parseInt(document.querySelector('#summaryDuration')?.textContent, 10) || 45,
      stable_segments_percent: 71,
      recovery_count: 3,
      valid_signal_coverage_percent: 94,
      comparison: '最近 5 次同类任务',
      personal_pattern: '中后段更稳定',
    };
  }

  const adapter = {
    id: 'local-preview',
    connected: false,
    async explainSession(payload, selectedMode) {
      await new Promise((resolve) => setTimeout(resolve, 720));
      const suggestion = selectedMode === 'guidance'
        ? '下一次可以继续采用 45–60 分钟工作块，并保留温和反馈；若持续游移，再主动打开短回收。'
        : '这段回顾只整理已存在的会话结果，不改变任何测量数值。';
      return {
        headline: `${payload.task}的中后段更稳，几次游移之后都回到了手边的任务。`,
        body: suggestion,
        provenance: {
          input: 'SessionSummary',
          excluded: '原始毫米波',
          provider: '本地模板预览',
          template: 'session-reflection-v1',
          generated_at: new Date().toISOString(),
        },
      };
    },
    async generateContentBatch({ count = 8 } = {}) {
      await new Promise((resolve) => setTimeout(resolve, 680));
      const offset = Math.floor(Date.now() / 1000) % CONTENT_DRAFTS.length;
      return Array.from({ length: Math.min(count, CONTENT_DRAFTS.length) }, (_, index) => {
        const draft = CONTENT_DRAFTS[(offset + index) % CONTENT_DRAFTS.length];
        return {
          ...draft,
          id: `draft-${Date.now()}-${index + 1}`,
          provenance: {
            provider: 'local-preview',
            template: 'focuswave-content-batch-v1',
            generated_at: new Date().toISOString(),
            review_status: 'draft'
          }
        };
      });
    },
  };

  function renderSettingsPanel() {
    const nav = document.querySelector('[data-setting="ai"]');
    const panel = document.querySelector('#setting-ai');
    if (!nav || !panel) return;
    nav.textContent = 'AI 与文字';
    panel.innerHTML = `
      <div class="settings-row">
        <div>
          <b>AI 服务</b>
          <p>离线 AI 内容批次已经进入新创短句库；外部模型未连接时，仍可继续筛选内容并在本机扩写草稿。</p>
          <div class="ai-integration-detail" id="aiIntegrationDetail" hidden>
            正式接入时，浏览器只调用 FocusWave AI Adapter。provider、模型、模板版本、输入摘要与生成时间写入每条结果的来源记录；密钥留在本地运行时或服务端，不进入网页。
          </div>
        </div>
        <div>
          <span class="pill">离线内容包 · 已接入</span>
          <button class="ghost" id="aiIntegrationDetails" type="button" style="margin-left:8px">接入说明</button>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <b>AI 使用范围</b>
          <p>AI 只在结构化状态与会话总结之后工作，不参与毫米波测量、注意状态推断或分数计算。</p>
        </div>
        <div class="setting-choices" id="aiModeSetting">
          ${MODES.map((item) => `<button class="mini-choice" type="button" data-ai-mode="${item.value}">${item.label}</button>`).join('')}
        </div>
      </div>
      <div class="settings-row">
        <div>
          <b>发送内容</b>
          <p>若以后启用云端 provider，每次发送前沿用这里的最小数据范围。</p>
        </div>
        <div class="ai-scope-stack">
          <span class="ai-scope-chip">结构化 SessionSummary</span>
          <span class="ai-scope-chip">不含原始毫米波</span>
          <span class="ai-scope-chip">不含身份信息</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <b>默认文字模式</b>
          <p>实时专注优先使用低延迟、已审核的本地内容库；AI 回顾只在会话结束后出现。</p>
        </div>
        <div class="setting-choices" id="defaultTextSetting">
          <button class="mini-choice" type="button" data-value="minimal">极简</button>
          <button class="mini-choice" type="button" data-value="original">原创短句</button>
          <button class="mini-choice" type="button" data-value="global">世界文学</button>
          <button class="mini-choice" type="button" data-value="classical">中文古典</button>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <b>内容与生成记录</b>
          <p>审核内容保留作者与来源；AI 结果保留 provider、模板、输入类型与生成时间。</p>
        </div>
        <button class="pill content-library-entry" type="button">查看内容库</button>
      </div>`;

    const savedTextMode = localStorage.getItem('focuswave.defaultTextMode') || 'original';
    panel.querySelectorAll('#defaultTextSetting [data-value]').forEach((button) => {
      const selected = button.dataset.value === savedTextMode;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => {
        localStorage.setItem('focuswave.defaultTextMode', button.dataset.value);
        panel.querySelectorAll('#defaultTextSetting [data-value]').forEach((item) => {
          const active = item === button;
          item.classList.toggle('selected', active);
          item.setAttribute('aria-pressed', String(active));
        });
      });
    });
    panel.querySelectorAll('[data-ai-mode]').forEach((button) => {
      button.addEventListener('click', () => selectMode(button.dataset.aiMode));
    });
    selectMode(mode());

    panel.querySelector('#aiIntegrationDetails')?.addEventListener('click', (event) => {
      const detail = panel.querySelector('#aiIntegrationDetail');
      detail.hidden = !detail.hidden;
      event.currentTarget.textContent = detail.hidden ? '接入说明' : '收起说明';
      event.currentTarget.setAttribute('aria-expanded', String(!detail.hidden));
    });
    panel.querySelector('.content-library-entry')?.addEventListener('click', async () => {
      if (window.FocusWaveContentEngine?.openLibrary) {
        window.FocusWaveContentEngine.openLibrary();
        return;
      }
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (window.FocusWaveContentEngine?.openLibrary) {
          window.FocusWaveContentEngine.openLibrary();
          return;
        }
      }
    });
  }

  function ensureSummaryCard() {
    const summary = document.querySelector('#page-summary .summary-copy');
    if (!summary || summary.querySelector('.ai-reflection-card')) return;
    const card = document.createElement('section');
    card.className = 'ai-reflection-card';
    card.dataset.status = 'idle';
    card.innerHTML = `
      <div class="ai-reflection-head">
        <div>
          <div class="eyebrow">AI REFLECTION · OPTIONAL</div>
          <h3>把这段专注整理成一句可行动的回顾。</h3>
        </div>
        <div class="ai-reflection-status" aria-live="polite">等待生成</div>
      </div>
      <p class="ai-reflection-intro">仅使用页面中的结构化会话总结。本地预览不会发送网络请求，也不会读取原始毫米波。</p>
      <button class="ghost" id="generateAIReflection" type="button">生成回顾</button>
      <div class="ai-reflection-result" aria-live="polite" hidden>
        <blockquote></blockquote>
        <p></p>
        <div class="ai-provenance"></div>
      </div>`;
    const actions = summary.querySelector(':scope > .actions');
    summary.insertBefore(card, actions || null);
    card.querySelector('#generateAIReflection').addEventListener('click', generateReflection);
    syncSummaryAvailability();
  }

  function syncSummaryAvailability() {
    const card = document.querySelector('.ai-reflection-card');
    if (!card) return;
    const button = card.querySelector('#generateAIReflection');
    const disabled = mode() === 'off';
    button.disabled = disabled;
    button.textContent = disabled ? 'AI 回顾已关闭' : '生成回顾';
    card.querySelector('.ai-reflection-status').textContent = disabled ? '已关闭' : '等待生成';
    if (disabled) card.dataset.status = 'idle';
  }

  async function generateReflection(event) {
    const button = event.currentTarget;
    const card = button.closest('.ai-reflection-card');
    const result = card.querySelector('.ai-reflection-result');
    card.dataset.status = 'loading';
    card.querySelector('.ai-reflection-status').textContent = '整理中';
    button.disabled = true;
    button.textContent = '正在整理';
    result.hidden = true;
    try {
      const output = await adapter.explainSession(summaryPayload(), mode());
      result.querySelector('blockquote').textContent = output.headline;
      result.querySelector('p').textContent = output.body;
      result.querySelector('.ai-provenance').innerHTML = `
        <span>输入：${output.provenance.input}</span>
        <span>排除：${output.provenance.excluded}</span>
        <span>${output.provenance.provider}</span>
        <span>模板：${output.provenance.template}</span>`;
      result.hidden = false;
      card.dataset.status = 'success';
      card.querySelector('.ai-reflection-status').textContent = '已生成 · 有来源记录';
      button.textContent = '重新生成';
    } catch (error) {
      card.dataset.status = 'error';
      card.querySelector('.ai-reflection-status').textContent = '生成失败';
      button.textContent = '重试';
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    renderSettingsPanel();
    ensureSummaryCard();
  }

  window.FocusWaveAIAdapter = adapter;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
