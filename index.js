joplin.plugins.register({
  onStart: async function() {
    const fs = joplin.require('fs-extra');
    const htmlMinifier = require('html-minifier').minify;
    const axios = require('axios');

    // Register command to export note as compact HTML and optionally send it to a server
    await joplin.commands.register({
      name: 'exportCompactHtml',
      label: 'Export as Compact HTML',
      iconName: 'fas fa-file-export',
      execute: async () => {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('No note selected.');
          return;
        }

        const htmlContent = note.body_html;

        // Minify the HTML content
        const minifiedHtml = htmlMinifier(htmlContent, {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        });

        // Write the minified HTML to a file
        const outputPath = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        await fs.writeFile(outputPath, minifiedHtml);
        await joplin.views.dialogs.showMessageBox(`Note exported as ${outputPath}`);

        // Get URL from settings
        const url = await joplin.settings.value('url');
        if (url) {
          const noteJson = {
            name: note.title,
            html: minifiedHtml,
            content: note.body
          };

          try {
            const response = await axios.post(url, noteJson);
            await joplin.views.dialogs.showMessageBox(`Note sent to ${url} with status: ${response.status}`);
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Failed to send note to ${url}: ${error.message}`);
          }
        }
      }
    });

    // Add the command to the note toolbar
    await joplin.views.toolbarButtons.create('exportCompactHtmlButton', 'exportCompactHtml', ToolbarButtonLocation.NoteToolbar);
  }
});
