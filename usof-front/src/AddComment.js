import './AddEditForms.css';
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { convert } from 'html-to-markdown';
import TurndownService from 'turndown';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { HtmlEditor, Image, Link, QuickToolbar, RichTextEditorComponent, Toolbar, Inject as RichTextInject } from '@syncfusion/ej2-react-richtexteditor';
import axiosInstance from './AxiosConfig';
import '@syncfusion/ej2-react-richtexteditor/styles/material.css';
import '@syncfusion/ej2-base/styles/material.css';

function AddComment() {
  let { postId, commentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const rteRef = useRef(null);
  if (postId !== undefined) {
    postId = postId ? atob(postId) : null;
  }
  commentId = commentId ? atob(commentId) : null;

  const addNewComment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    };

    try {
      if (postId !== undefined) {
        const response = await axiosInstance.post(`posts/${postId}/comments`, addedData);
      }
      else {
        const response = await axiosInstance.post(`comments/${commentId}/reply`, addedData);
      }
      alert('Comment added successfully!');
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

  const handleCancel = (event) => {
    event.preventDefault();
    window.history.back();
  };

  return (
	<form onSubmit={addNewComment} class='form' >
           <h1 id='form-header'>Add Comment</h1>

           <br/><br/><label class='login-label' id='content-label'>Content</label><br/><br/>
           <RichTextEditorComponent toolbarSettings={toolbarConfig} value={content} onChange={(e) => setContent(e.target.value)} ref={rteRef}>
             <RichTextInject services={[HtmlEditor, Image, Link, Toolbar, QuickToolbar]} />
             <div></div>
           </RichTextEditorComponent>
           <br/><br/><button id='login-btn' type="submit">Add Comment</button><br/>

           <a class='a-login-form' href="#" onClick={handleCancel} id="cancel-btn">Cancel</a><br/><br/>
       </form>
  );
}

export default AddComment;
