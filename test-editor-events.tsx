import React, { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Editor, EditorProvider } from 'react-simple-wysiwyg';

// We can't really test execCommand triggering React events in Node easily without JSDOM.
