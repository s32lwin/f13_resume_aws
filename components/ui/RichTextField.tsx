import React, { useRef, useCallback, useEffect } from 'react';

// SVG Icons for the toolbar
const BoldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 4a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 4a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z" clipRule="evenodd" /></svg>
);
const ItalicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7.75 5.5a.75.75 0 0 0 0 1.5h1.22l-2.43 6.5H5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5H9.28l2.43-6.5H13a.75.75 0 0 0 0-1.5H7.75Z" /></svg>
);
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 9.75A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 5A.75.75 0 0 1 2.75 14h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 14.75Z" clipRule="evenodd" /></svg>
);

interface RichTextFieldProps {
  htmlContent: string;
  onHtmlChange: (html: string) => void;
}

const RichTextField: React.FC<RichTextFieldProps> = ({ htmlContent, onHtmlChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false); // Track IME composition state
  const lastContent = useRef(htmlContent);

  // Clean HTML content and enforce LTR direction
  const cleanHtmlContent = useCallback((html: string) => {
    // Remove RTL control characters
    let cleaned = html.replace(/[\u200E-\u200F\u202A-\u202E\u2066-\u2069]/g, '');
    
    // Ensure LTR direction in all elements
    if (!cleaned.includes('dir=')) {
      cleaned = cleaned.replace(/<([a-z][a-z0-9]*)([^>]*)>/gi, (match, tag, attrs) => {
        // Skip certain tags that shouldn't have dir attributes
        if (['html', 'head', 'body', 'meta', 'link', 'script', 'style'].includes(tag.toLowerCase())) {
          return match;
        }
        return `<${tag} dir="ltr"${attrs}>`;
      });
    }
    
    return cleaned;
  }, []);

  // Initialize editor and handle external content changes
  useEffect(() => {
    if (editorRef.current) {
      const cleanedContent = cleanHtmlContent(htmlContent);
      if (cleanedContent !== htmlContent) {
        onHtmlChange(cleanedContent);
        return; // Wait for the next render with cleaned content
      }
      
      // Only update if content actually changed
      if (editorRef.current.innerHTML !== cleanedContent) {
        // Save selection
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const cursorAtStart = range?.startOffset === 0 && range?.endOffset === 0;
        
        // Update content
        editorRef.current.innerHTML = cleanedContent;
        
        // Restore cursor position if it was at start
        if (cursorAtStart && editorRef.current.firstChild) {
          const newRange = document.createRange();
          newRange.setStart(editorRef.current.firstChild, 0);
          newRange.setEnd(editorRef.current.firstChild, 0);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        }
      }
    }
  }, [htmlContent, cleanHtmlContent, onHtmlChange]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isComposingRef.current) return;
    
    const newHtml = cleanHtmlContent(editorRef.current.innerHTML);
    if (newHtml !== lastContent.current) {
      lastContent.current = newHtml;
      editorRef.current.innerHTML = newHtml; // Reapply cleaned content
      onHtmlChange(newHtml);
    }
  }, [onHtmlChange, cleanHtmlContent]);

  const handleComposition = useCallback((e: React.CompositionEvent) => {
    isComposingRef.current = e.type !== 'compositionend';
    if (!isComposingRef.current) {
      handleInput(); // Finalize composition
    }
  }, [handleInput]);

  const execCmd = (command: string) => {
    // First ensure we're in LTR mode
    document.execCommand('styleWithCSS', false, 'true');
    
    // Execute the actual command
    document.execCommand(command, false, undefined);
    
    // Force LTR direction after command execution
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.direction = 'ltr';
        span.setAttribute('dir', 'ltr');
        range.surroundContents(span);
      }
      
      editorRef.current.focus();
      handleInput();
    }
  };

  return (
    <div 
      className="border border-slate-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500"
      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
      dir="ltr"
    >
      <div className="toolbar flex items-center p-1 bg-slate-50 border-b border-slate-300 rounded-t-md">
        <button 
          type="button" 
          onClick={() => execCmd('bold')} 
          className="p-1 rounded hover:bg-slate-200" 
          aria-label="Bold"
        >
          <BoldIcon />
        </button>
        <button 
          type="button" 
          onClick={() => execCmd('italic')} 
          className="p-1 rounded hover:bg-slate-200" 
          aria-label="Italic"
        >
          <ItalicIcon />
        </button>
        <button 
          type="button" 
          onClick={() => execCmd('insertUnorderedList')} 
          className="p-1 rounded hover:bg-slate-200" 
          aria-label="Bulleted List"
        >
          <ListIcon />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onCompositionStart={handleComposition}
        onCompositionEnd={handleComposition}
        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(htmlContent) }}
        className="prose prose-sm max-w-none p-2 min-h-[100px] focus:outline-none"
        style={{ 
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'isolate',
        }}
        dir="ltr"
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextField;