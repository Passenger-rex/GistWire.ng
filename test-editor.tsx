import React from 'react';
import { renderToString } from 'react-dom/server';
import { Editor, EditorProvider } from 'react-simple-wysiwyg';

const App = () => (
  <EditorProvider>
    <Editor value="test" onChange={()=>{}} onPaste={() => console.log('pasted')} />
  </EditorProvider>
);

console.log(renderToString(<App />));
