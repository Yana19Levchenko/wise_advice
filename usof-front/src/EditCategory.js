import './AddEditForms.css';
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from './AxiosConfig';
import '@syncfusion/ej2-react-richtexteditor/styles/material.css';
import '@syncfusion/ej2-base/styles/material.css';

function EditCategory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  let { categoryId } = useParams();
  categoryId = categoryId ? atob(categoryId) : null;

  const editCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const editedData = {
      title,
      description,
    };

    try {
      const response = await axiosInstance.patch(`categories/${categoryId}`, editedData);
      alert('Category edited successfully!');
    } catch (err) {
      alert(err.response?.data?.error);
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const getData = async() => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`categories/${categoryId}`);
      setTitle(response.data[0].title);
      setDescription(response.data[0].description);
    } catch (err) {
      alert(err.response?.data?.error);
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  return (
	<form onSubmit={editCategory} class='form' >
           <h1 id='form-header'>Edit Category</h1>

           <label class='login-label' id='title-label'>Title</label><br/><br/>
           <input placeholder='Title' id='title-input' value={title} onChange={(e) => setTitle(e.target.value)}/>
           <br/><br/><label class='login-label' id='desc-label'>Description</label><br/><br/>
           <textarea placeholder='Description' id='desc-input' value={description} onChange={(e) => setDescription(e.target.value)}></textarea>

           <br/><br/><button id='login-btn' type="submit">Edit Category</button><br/>

           <a class='a-login-form' href='/admin_panel' id="cancel-btn">Cancel</a><br/><br/>
       </form>
  );
}

export default EditCategory;
