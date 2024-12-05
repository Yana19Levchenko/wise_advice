import './AddEditForms.css';
import React from 'react';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from './AxiosConfig';
import '@syncfusion/ej2-react-richtexteditor/styles/material.css';
import '@syncfusion/ej2-base/styles/material.css';

function AddCategory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const addCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const addedData = {
      title,
      description,
    };

    try {
      const response = await axiosInstance.post(`categories`, addedData);
      alert('Category added successfully!');
    } catch (err) {
      alert(err.response?.data?.error);
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
	<form onSubmit={addCategory} class='form' >
           <h1 id='form-header'>Add Category</h1>

           <label class='login-label' id='title-label'>Title</label><br/><br/>
           <input placeholder='Title' id='title-input' value={title} onChange={(e) => setTitle(e.target.value)}/>
           <br/><br/><label class='login-label' id='desc-label'>Description</label><br/><br/>
           <textarea placeholder='Description' id='desc-input' value={description} onChange={(e) => setDescription(e.target.value)}></textarea>

           <br/><br/><button id='login-btn' type="submit">Add Category</button><br/>

           <a class='a-login-form' href='/admin_panel' id="cancel-btn">Cancel</a><br/><br/>
       </form>
  );
}

export default AddCategory;
