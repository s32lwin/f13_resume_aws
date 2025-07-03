import React, { useRef, useEffect, useCallback } from 'react';

// SVG Icons for the toolbar
const BoldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M5.5 4.25a.75.75 0 0 1 .75-.75h4.5a3.75 3.75 0 0 1 3.75 3.75v.25a3.75 3.75 0 0 1-3.75 3.75h-2.5a.75.75 0 0 0 0 1.5h2.5a5.25 5.25 0 0 0 5.25-5.25v-.25a5.25 5.25 0 0 0-5.25-5.25h-4.5a.75.75 0 0 1-.75.75V15a.75.75 0 0 1-1.5 0V4.25Z" />
    </svg>
);
const ItalicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7.75 5.5a.75.75 0 0 0 0 1.5h1.22l-2.43 6.5H5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5H9.28l2.43-6.5H13a.75.75 0 0 0 0-1.5H7.75Z" /></svg>
);
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5 10a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 5 10Zm0-3.5a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75Zm0 7a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M3 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
);

interface RichTextFieldProps {
  htmlContent: string;
  onHtmlChange: (html: string) => void;
}

const RichTextField: React.FC<RichTextFieldProps> = ({ htmlContent, onHtmlChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // This effect synchronizes the editor's content with the `htmlContent` prop.
  // It runs when the prop changes, ensuring external updates (like loading data)
  // are reflected in the editor.
  useEffect(() => {
    if (editorRef.current && htmlContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  // This handler is called on user input, updating the parent component's state.
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      onHtmlChange(newHtml);
    }
  }, [onHtmlChange]);

  const execCmd = (command: string) => {
    // Note: execCommand is deprecated but is the simplest way for this requirement.
    // For a production app, a library like Tiptap/Lexical would be better.
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
        editorRef.current.focus();
        handleInput(); // Update state after executing a command
    }
  };

  return (
    <div className="border border-slate-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      <div className="toolbar flex items-center p-1 bg-slate-50 border-b border-slate-300 rounded-t-md">
        <button type="button" onClick={() => execCmd('bold')} className="p-1 rounded hover:bg-slate-200" aria-label="Bold"><BoldIcon /></button>
        <button type="button" onClick={() => execCmd('italic')} className="p-1 rounded hover:bg-slate-200" aria-label="Italic"><ItalicIcon /></button>
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1 rounded hover:bg-slate-200" aria-label="Bulleted List"><ListIcon /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        // By not using `dangerouslySetInnerHTML` here, we allow the user to freely edit
        // without React resetting the content and cursor on every keystroke.
        // The `useEffect` hook handles setting the initial and updated content.
        dir="ltr"
        className="prose prose-sm max-w-none p-2 min-h-[100px] focus:outline-none text-left"
      />
    </div>
  );
};

export default RichTextField;