window.App = window.App || {};

(function() {
  const UI = {
    // State
    state: {
      content: '',
      isAiOpen: false,
      isAiLoading: false,
      aiResponse: '',
      isScrollSync: true
    },

    // Render the main app structure
    render() {
      const $app = $('#app');
      $app.html(`
        <div class="h-screen flex flex-col bg-slate-50 overflow-hidden">
          <!-- Navigation / Toolbar -->
          <header class="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
            <div class="flex items-center gap-4">
              <a href="index.html" class="group flex items-center gap-2 text-slate-700 hover:text-teal-600 transition-colors">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
                  <i class="fa-solid fa-feather-pointed"></i>
                </div>
                <span class="font-bold text-lg tracking-tight">MarkFlow</span>
              </a>
              <div class="h-6 w-px bg-slate-200 mx-2"></div>
              <input type="text" id="doc-title" value="Untitled Document" class="bg-transparent border-none text-slate-600 font-medium focus:ring-0 placeholder-slate-400 w-64 hover:bg-slate-50 rounded px-2 py-1 transition-colors">
            </div>

            <div class="flex items-center gap-2">
              <button id="btn-ai-toggle" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                <i class="fa-solid fa-sparkles"></i>
                <span>AI Assist</span>
              </button>
              <button id="btn-sync-scroll" class="p-2 text-teal-600 bg-teal-50 rounded-lg transition-colors" title="Toggle Scroll Sync">
                <i class="fa-solid fa-link"></i>
              </button>
              <div class="h-6 w-px bg-slate-200 mx-2"></div>
              <button id="btn-copy-html" class="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Copy HTML">
                <i class="fa-solid fa-code"></i>
              </button>
              <button id="btn-download" class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <i class="fa-solid fa-download"></i>
                <span>Export</span>
              </button>
            </div>
          </header>

          <!-- Main Workspace -->
          <main class="flex-1 flex overflow-hidden relative">
            <!-- Editor Pane -->
            <section class="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white relative group">
              <div class="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
              <div class="flex-1 relative">
                <textarea id="editor" class="editor-input p-8 w-full h-full text-slate-700 leading-relaxed resize-none focus:outline-none" placeholder="Start writing your story..."></textarea>
              </div>
              <!-- Toolbar Overlay (appears on hover or focus) -->
              <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-full px-4 py-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                 <button class="toolbar-btn w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600" data-format="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>
                 <button class="toolbar-btn w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600" data-format="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>
                 <button class="toolbar-btn w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600" data-format="heading" title="Heading"><i class="fa-solid fa-heading"></i></button>
                 <div class="w-px h-4 bg-slate-200 my-auto"></div>
                 <button class="toolbar-btn w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600" data-format="list" title="List"><i class="fa-solid fa-list-ul"></i></button>
                 <button class="toolbar-btn w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600" data-format="quote" title="Quote"><i class="fa-solid fa-quote-right"></i></button>
                 <button class="toolbar-btn w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600" data-format="code" title="Code Block"><i class="fa-solid fa-code"></i></button>
              </div>
            </section>

            <!-- Preview Pane -->
            <section class="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
              <div class="absolute top-4 right-6 text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Preview</div>
              <div id="preview" class="flex-1 overflow-y-auto p-8 lg:p-12 markdown-body font-serif-pro">
                <!-- Content renders here -->
              </div>
            </section>

            <!-- AI Panel (Slide-over) -->
            <aside id="ai-panel" class="absolute top-4 right-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 transform translate-x-[110%] transition-transform duration-300 flex flex-col z-30">
              <div class="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-bold text-slate-800 flex items-center gap-2">
                  <i class="fa-solid fa-robot text-indigo-500"></i> AI Assistant
                </h3>
                <button id="btn-close-ai" class="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div class="text-sm text-slate-500 leading-relaxed">
                  Use the AI to summarize your text, fix grammar, or generate ideas. The model runs entirely in your browser.
                </div>
                
                <!-- Model Status -->
                <div id="ai-status-card" class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-slate-500 uppercase">Engine Status</span>
                    <span id="ai-status-indicator" class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  </div>
                  <div id="ai-progress-bar" class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                     <div class="h-full bg-indigo-500 w-0 transition-all duration-300" style="width: 0%"></div>
                  </div>
                  <p id="ai-status-text" class="text-xs text-slate-500">Initializing AI Engine...</p>
                </div>

                <!-- Actions -->
                <div id="ai-actions" class="flex flex-col gap-2 opacity-50 pointer-events-none transition-opacity">
                   <button class="ai-action-btn group w-full py-3 px-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl text-left text-sm font-medium text-slate-700 hover:text-indigo-900 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer" data-prompt="Summarize the content in 3 bullet points.">
                     <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 flex items-center justify-center transition-colors"><i class="fa-solid fa-list-check"></i></span>
                     <span>Summarize Content</span>
                   </button>
                   <button class="ai-action-btn group w-full py-3 px-4 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 hover:shadow-md rounded-xl text-left text-sm font-medium text-slate-700 hover:text-emerald-900 transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer" data-prompt="Fix grammar and improve flow of the text.">
                     <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center transition-colors"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                     <span>Improve Writing</span>
                   </button>

                <!-- Output Area -->
                <div id="ai-output" class="hidden mt-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-sm text-slate-700 leading-relaxed font-serif-pro">
                  <!-- Streaming content -->
                </div>
                 <button id="btn-stop-ai" class="hidden w-full py-2 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200">Stop Generating</button>
              </div>
            </aside>
          </main>
        </div>

        <!-- Toast Container -->
        <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>
      `);
    },

    updatePreview(markdown) {
      if (!markdown) {
        $('#preview').html('<div class="h-full flex flex-col items-center justify-center text-slate-300 select-none"><i class="fa-brands fa-markdown text-6xl mb-4 opacity-50"></i><p class="text-lg font-medium">Nothing to preview yet</p></div>');
        return;
      }
      // Parse via marked, sanitize via DOMPurify
      const rawHtml = marked.parse(markdown);
      const safeHtml = window.App.Helpers.sanitize(rawHtml);
      $('#preview').html(safeHtml);
    },

    toggleAI(forceState) {
      const $panel = $('#ai-panel');
      const $btn = $('#btn-ai-toggle');
      
      if (typeof forceState === 'boolean') {
        this.state.isAiOpen = forceState;
      } else {
        this.state.isAiOpen = !this.state.isAiOpen;
      }

      if (this.state.isAiOpen) {
        $panel.removeClass('translate-x-[110%]').addClass('translate-x-0');
        $btn.removeClass('bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100')
            .addClass('bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700');
      } else {
        $panel.addClass('translate-x-[110%]').removeClass('translate-x-0');
        $btn.removeClass('bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700')
            .addClass('bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100');
      }
    },

    setLoading(isLoading, percent = 0, message = '') {
      const $barContainer = $('#ai-progress-bar');
      const $bar = $barContainer.find('div');
      const $text = $('#ai-status-text');
      const $indicator = $('#ai-status-indicator');
      const $actions = $('#ai-actions');

      if (isLoading) {
        $barContainer.removeClass('hidden');
        const label = (message && (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('download'))) ? 'Downloading AI Model...' : 'Loading AI Model...';
        $text.text(`${label} ${percent}%`);
        $bar.css('width', `${percent}%`);
        $indicator.removeClass('bg-emerald-500 bg-slate-300').addClass('bg-amber-400 animate-pulse');
      } else {
        // Loaded state
        $barContainer.addClass('hidden');
        $text.text('AI Ready. Model loaded locally.');
        $indicator.removeClass('bg-amber-400 animate-pulse').addClass('bg-emerald-500');
        $actions.removeClass('opacity-50 pointer-events-none');
      }
    },

    toggleScrollSync() {
      this.state.isScrollSync = !this.state.isScrollSync;
      const $btn = $('#btn-sync-scroll');
      if (this.state.isScrollSync) {
        $btn.removeClass('text-slate-400').addClass('text-teal-600 bg-teal-50');
        this.showToast('Scroll sync enabled');
      } else {
        $btn.removeClass('text-teal-600 bg-teal-50').addClass('text-slate-400');
        this.showToast('Scroll sync disabled');
      }
    },
    showToast(message, type = 'info') {
      const colorClass = type === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white';
      const icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-check"></i>';
      
      const $toast = $(`
        <div class="toast-enter pointer-events-auto px-4 py-3 rounded-xl shadow-lg ${colorClass} flex items-center gap-3 text-sm font-medium min-w-[200px]">
          ${icon}
          <span>${message}</span>
        </div>
      `);

      $('#toast-container').append($toast);
      setTimeout(() => {
        $toast.fadeOut(300, function() { $(this).remove(); });
      }, 3000);
    }
  };

  window.App.ui = UI;
})();