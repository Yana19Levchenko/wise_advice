import './AddEditForms.css';
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { marked } from 'marked';
import { convert } from 'html-to-markdown';
import TurndownService from 'turndown';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { HtmlEditor, Image, Link, QuickToolbar, RichTextEditorComponent, Toolbar, Inject as RichTextInject } from '@syncfusion/ej2-react-richtexteditor';
import axiosInstance from './AxiosConfig';
import '@syncfusion/ej2-react-richtexteditor/styles/material.css';
import '@syncfusion/ej2-base/styles/material.css';

function EditComment() {
  let { commentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('active');
  const [state, setState] = useState('unlock');
  const [prevState, setPrevState] = useState(state);
  const rteRef = useRef(null);
  const authToken = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(authToken);
  commentId = commentId ? atob(commentId) : null;

  const editComment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (prevState !== state) {
      if (state === 'locked') {
        lockFunction();
      } else if (state === 'unlocked') {
        unlockFunction();
      }
      setPrevState(state);
    }

    const rteElement = rteRef.current.element;
    const rteContent = rteElement.innerHTML;
    const turndownService = new TurndownService();
    const markdownContent = turndownService.turndown(rteContent);

    const imageMatches = markdownContent.match(/!\[.*?\]\((blob:[^)]+)\)/);
    let updatedContent = markdownContent;
    if (imageMatches) {
      const imageName = 'img.png';
      const imageBlobUrl = imageMatches[1];
      const imageFile = await fetch(imageBlobUrl).then(res => res.blob());
      const formData = new FormData();
      formData.append('image', imageFile, imageName);

      const uploadResponse = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.url;
      updatedContent = markdownContent.replace(imageBlobUrl, imageUrl);
    }

    const addedData = {
      content: updatedContent.replace(/^Paragraph\s*\n/, ''),
      status: status,
    };

    try {
        const response = await axiosInstance.patch(`comments/${commentId}`, addedData);
        alert('Comment edited successfully!');
    } catch (err) {
      alert(err.response?.data?.error);
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const toolbarConfig = {
    display: [
      "INLINE_STYLE_BUTTONS",
      "BLOCK_TYPE_BUTTONS",
      "LINK_BUTTONS"
    ],
    INLINE_STYLE_BUTTONS: [
      { label: "Bold", style: "BOLD", className: "custom-css-class" },
      { label: "Italic", style: "ITALIC" },
      { label: "Underline", style: "UNDERLINE" }
    ],
    BLOCK_TYPE_BUTTONS: [
      { label: "UL", style: "unordered-list-item" },
      { label: "OL", style: "ordered-list-item" },
      { label: "Blockquote", style: "blockquote" }
    ],
    LINK_BUTTONS: [
      { label: "Link", style: "LINK" },
      { label: "Remove Link", style: "REMOVE_LINK" }
    ]
  };

  const getContent = async () => {
    try {
      const response = await axiosInstance.get(`comments/${commentId}`);
      const data = response.data[0];
      setContent(data.content);
      setStatus(data.status);
      setState(data.locked? 'locked' : 'unlocked');
      setPrevState(data.locked? 'locked' : 'unlocked');
    } catch (error) {
      setError('Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (event) => {
    event.preventDefault();
    window.history.back();
  };

  const lockFunction = async() => {
    try {
      const response = await axiosInstance.patch(`comments/${commentId}/lock`);
    } catch (error) {
      setError('Failed');
    } finally {
      setLoading(false);
    }
  };

  const unlockFunction = async() => {
    try {
      const response = await axiosInstance.patch(`comments/${commentId}/unlock`);
    } catch (error) {
      setError('Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getContent();
    if (rteRef.current) {
      const htmlContent = marked(content);
      rteRef.current.value = htmlContent;
    }
  }, [content]);

  return (
	<form onSubmit={editComment} class='form' >
           <h1 id='form-header'>Edit Comment</h1>

           <br/><br/><label class='login-label' id='content-label'>Content</label><br/><br/>
           <RichTextEditorComponent toolbarSettings={toolbarConfig} value={content} onChange={(e) => setContent(e.target.value)} ref={rteRef}>
             <RichTextInject services={[HtmlEditor, Image, Link, Toolbar, QuickToolbar]} />
             <div></div>
           </RichTextEditorComponent>
           {decodedToken.role === 'admin' && (
             <>
               <label class='login-label' id='status-label'>Status</label><br/><br/>
               <select id='select-status' value={status} onChange={(e) => setStatus(e.target.value)}>
                 <option value="active">Active</option>
                 <option value="inactive">Inactive</option>
               </select>
               <br/><br/>
               <label class='login-label' id='status-label'>State</label><br/><br/>
               <select id='select-state' value={state} onChange={(e) => setState(e.target.value)}>
                 <option value="locked">Locked</option>
                 <option value="unlocked">Unlocked</option>
               </select>
               <br/><br/>
             </>
           )}
           <br/><br/><button id='login-btn' type="submit">Edit Comment</button><br/>

           <a class='a-login-form' href="#" onClick={handleCancel} id="cancel-btn">Cancel</a><br/><br/>
       </form>
  );
}

export default EditComment;
