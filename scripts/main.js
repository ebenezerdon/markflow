$(function() {
  // Contract Check
  if (!window.App || !window.App.ui || !window.App.Helpers) {
    console.error('Critical modules missing');
    return;
  }

  const { ui, Helpers } = window.App;
  const { Storage, debounce, downloadFile } = Helpers;

  // Init
  ui.render();
  Helpers.configureMarked();

  // Load saved content
  const savedContent = Storage.get('markflow_content', '# Welcome to MarkFlow\n\nStart typing on the left to see the **magic** happen on the right.');
  const savedTitle = Storage.get('markflow_title', 'Untitled Document');
  
  $('#editor').val(savedContent);
  $('#doc-title').val(savedTitle);
  ui.updatePreview(savedContent);

  // Event Listeners
  const handleInput = debounce(function() {
    const content = $('#editor').val();
    ui.updatePreview(content);
    Storage.set('markflow_content', content);
  }, 200);

  $('#editor').on('input', handleInput);

  $('#doc-title').on('input', function() {
    Storage.set('markflow_title', $(this).val());
  });

  // Scroll Sync Logic
  let isSyncingLeft = false;
  let isSyncingRight = false;
  const $editor = $('#editor');
  const $preview = $('#preview');

  $editor.on('scroll', function() {
    if (!ui.state.isScrollSync || isSyncingLeft) {
      isSyncingLeft = false;
      return;
    }
    isSyncingRight = true;
    const percentage = this.scrollTop / (this.scrollHeight - this.offsetHeight);
    const previewEl = $preview[0];
    previewEl.scrollTop = percentage * (previewEl.scrollHeight - previewEl.offsetHeight);
  });

  $preview.on('scroll', function() {
    if (!ui.state.isScrollSync || isSyncingRight) {
      isSyncingRight = false;
      return;
    }
    isSyncingLeft = true;
    const percentage = this.scrollTop / (this.scrollHeight - this.offsetHeight);
    const editorEl = $editor[0];
    editorEl.scrollTop = percentage * (editorEl.scrollHeight - editorEl.offsetHeight);
  });

  $('#btn-sync-scroll').on('click', function() {
    ui.toggleScrollSync();
  });

  // Toolbar Actions
  $('.toolbar-btn').on('click', function() {
    const format = $(this).data('format');
    const $editor = $('#editor');
    const el = $editor[0];
    const scrollTop = el.scrollTop;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = $editor.val();
    const selection = text.substring(start, end);
    
    let insertion = '';
    let cursorOffset = 0;

    switch(format) {
      case 'bold': insertion = `**${selection || 'bold text'}**`; cursorOffset = 2; break;
      case 'italic': insertion = `*${selection || 'italic text'}*`; cursorOffset = 1; break;
      case 'heading': insertion = `\n# ${selection || 'Heading'}`; cursorOffset = 3; break;
      case 'list': insertion = `\n- ${selection || 'List item'}`; cursorOffset = 3; break;
      case 'quote': insertion = `\n> ${selection || 'Quote'}`; cursorOffset = 3; break;
      case 'code': insertion = `\n\`\`\`\n${selection || 'code'}\n\`\`\``; cursorOffset = 4; break;
    }

    const newText = text.substring(0, start) + insertion + text.substring(end);
    $editor.val(newText);
    
    // Restore selection and cursor position
    if (selection.length === 0) {
        el.selectionStart = el.selectionEnd = start + cursorOffset;
    } else {
        el.selectionStart = start;
        el.selectionEnd = start + insertion.length;
    }
    
    el.scrollTop = scrollTop;
    
    handleInput(); // Trigger update
  });

  // Header Actions
  $('#btn-download').on('click', function() {
    const content = $('#editor').val();
    const filename = ($('#doc-title').val() || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
    downloadFile(filename, content);
    ui.showToast('File downloaded successfully');
  });

  $('#btn-copy-html').on('click', function() {
    const html = $('#preview').html();
    navigator.clipboard.writeText(html).then(() => {
      ui.showToast('HTML copied to clipboard');
    });
  });

  // AI Logic
  $('#btn-ai-toggle, #btn-close-ai').on('click', function() {
    ui.toggleAI();
  });


  $('.ai-action-btn').on('click', async function() {
    if (!window.AppLLM.ready) return;
    
    const promptType = $(this).data('prompt');
    const content = $('#editor').val();
    
    if (!content.trim()) {
      ui.showToast('Write some text first!', 'error');
      return;
    }

    const $output = $('#ai-output');
    const $stop = $('#btn-stop-ai');
    $output.removeClass('hidden').html('<span class="animate-pulse">Thinking...</span>');
    $stop.removeClass('hidden');
    
    let fullResponse = '';
    
    try {
       let systemPrompt = "You are a helpful Markdown writing assistant. Respond only with the requested content. Do not chat.";
       let userPrompt = "";
       
       if (promptType.includes("Summarize")) {
          userPrompt = `Summarize the following markdown text in 3 concise bullet points:\n\n${content}`;
       } else {
          userPrompt = `Rewrite the following markdown text to improve grammar, flow, and clarity. Keep the markdown formatting:\n\n${content}`;
       }

       
       await window.AppLLM.generate(userPrompt, {
         system: systemPrompt,
         onToken: (token) => {
           fullResponse += token;
           // Simple streaming render - convert formatting later if needed, 
           // but for AI panel plain text or simple markdown is fine.
           // We'll replace newlines with <br> for simple display
           $output.html(fullResponse.replace(/\n/g, '<br>'));
           $output.scrollTop($output[0].scrollHeight);
         }
       });
    } catch (err) {
       ui.showToast('Generation failed', 'error');
    } finally {
       $stop.addClass('hidden');
    }
  });

  $('#btn-stop-ai').on('click', function() {
    window.AppLLM.stop();
    $(this).addClass('hidden');
    ui.showToast('Generation stopped');
  });
  // Auto-load AI on startup
  (async function initAI() {
    try {
      ui.setLoading(true, 0);
      await window.AppLLM.load(null, (percent, text) => {
        ui.setLoading(true, percent, text);
      });
      ui.setLoading(false);
      ui.showToast('AI Model Ready');
    } catch (err) {
      console.error(err);
      $('#ai-status-text').text('Error: ' + (err.message || 'WebGPU check failed'));
      $('#ai-status-indicator').removeClass('bg-amber-400 animate-pulse').addClass('bg-rose-500');
      ui.showToast('AI Initialization Failed', 'error');
    }
  })();
});