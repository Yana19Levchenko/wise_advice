import './AddEditForms.css';
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { convert } from 'html-to-markdown';
import TurndownService from 'turndown';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { HtmlEditor, Image, Link, QuickToolbar, RichTextEditorComponent, Toolbar, Inject as RichTextInject } from '@syncfusion/ej2-react-richtexteditor';
import axiosInstance from './AxiosConfig';
import '@syncfusion/ej2-react-richtexteditor/styles/material.css';
import '@syncfusion/ej2-base/styles/material.css';

function AddForm() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories,setSelectedCategories] = useState([]);
  const rteRef = useRef(null);

  const addPost = async (e) => {
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
      title,
      content: updatedContent.replace(/^Paragraph\s*\n/, ''),
      categories: selectedCategories.join(','),
    };

    try {
      const response = await axiosInstance.post(`posts`, addedData);
      alert('Post added successfully!');
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

  const getCategories = async () => {
    try {
      const response = await axiosInstance.get(`categories`);
      const categories = response.data;
      setCategories(categories);
    } catch (error) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }

  const ChooseCategory = async (category) => {
    setLoading(true);
    if (selectedCategories.includes(category.title)) {
      rmCategory(category);
    }
    else {
        document.getElementById(category.id).classList.add('active-category');
        setSelectedCategories([...selectedCategories, category.title]);
    }
  };

  const rmCategory = async (category) => {
    document.getElementById(category.id).classList.remove('active-category');
    setSelectedCategories(prev => prev.filter(title => title !== category.title));
  };

  useEffect(() => {
    getCategories();
  }, []);

  const handleCancel = (event) => {
    event.preventDefault();
    window.history.back();
  };

  return (
	<form onSubmit={addPost} class='form' >
           <h1 id='form-header'>Add Post</h1>

           <label class='login-label' id='title-label'>Title</label><br/><br/>
           <input placeholder='Title' id='title-input' value={title} onChange={(e) => setTitle(e.target.value)}/>
           <br/><br/><label class='login-label' id='content-label'>Content</label><br/><br/>
           <RichTextEditorComponent toolbarSettings={toolbarConfig} value={content} onChange={(e) => setContent(e.target.value)} ref={rteRef}>
             <RichTextInject services={[HtmlEditor, Image, Link, Toolbar, QuickToolbar]} />
             <div></div>
           </RichTextEditorComponent>
           <label class='login-label'>Categories</label><br/><br/>
           <div class='categories-container form-cont'>
              {categories.map(category => (
                 <div id={category.id} class='category form-category' key={category.id} onClick={() => ChooseCategory(category)}>
                   <span>{category.title}</span>
                 </div>
              ))}
           </div>
           <br/><br/><button id='login-btn' type="submit">Add Post</button><br/>

           <a class='a-login-form' onClick={handleCancel} id="cancel-btn">Cancel</a><br/><br/>
       </form>
  );
}

export default AddForm;
