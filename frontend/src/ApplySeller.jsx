import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './ApplySeller.css';
import Navbar from "./Navbar";
import { useSeller } from './SellerContext';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
function ApplySeller() {
    const navigate = useNavigate();
    const { setIsSeller } = useSeller();

    // Local state for handling file and image preview
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);
    const [shopName, setShopName] = useState("");
    const [shopTagline, setShopTagline] = useState("");

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            setPreviewURL(URL.createObjectURL(file));
        } else {
            alert("Please upload a valid image file (JPG, PNG, GIF, etc.)");
            setSelectedFile(null);
            setPreviewURL(null);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewURL(null);
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // build multi‑part form data
        const formData = new FormData();
        formData.append("shop_name", shopName);
        formData.append("shop_tagline", shopTagline);
        formData.append("logo", selectedFile);

        try {
            // send with auth cookie or Bearer token (Sanctum)
            await axios.post("/api/apply-seller", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                },
                withCredentials: true

            });
            toast.success('Product added successfully!', {
                style: {
                    fontSize: '20px', // increase font size
                    minWidth: '500px',
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            });
            localStorage.setItem("role", "seller");
            setIsSeller(true);
            navigate("/seller");
        } catch (err) {
            console.error(err);
            alert("Failed to apply. Please try again.");
            console.log(err.response.data);
            console.log(localStorage.getItem('token'));
        }
    };

    return (
        <div className="apply-seller-page">
            <div className="apply-seller-contents">

                <div className="apply-seller-title">Apply to be a Seller</div>

                <form className="apply-form" onSubmit={handleSubmit}>
                    <div className="form-container">
                        <div className="text-input-container">
                            <div>
                                <label htmlFor="shop-name">Shop Name</label>
                                <input
                                    type="text"
                                    id="shop-name"
                                    name="shop-name"
                                    placeholder="Enter your shop name"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    required />
                            </div>
                            <div>
                                <label htmlFor="shop-tagline">Shop Tagline</label>
                                <textarea
                                    id="shop-tagline"
                                    name="shop-tagline"
                                    placeholder="Enter your shop tagline here"
                                    value={shopTagline}
                                    onChange={(e) => setShopTagline(e.target.value)}
                                    required />
                            </div>
                        </div>

                        <div className="image-input-container">
                            <div className="header">
                                <label htmlFor="file-upload" className="form-label">Shop Logo</label>
                                {selectedFile && (
                                    <button type="button" className="btn-remove" onClick={handleRemoveImage}>Remove</button>
                                )}
                            </div>

                            <label htmlFor="file-upload" className="custom-file-upload">
                                <div className="upload-box">
                                    <p id="file-name">{selectedFile ? `${selectedFile.name}` : 'Click to upload a file here'}</p>
                                    {previewURL && (
                                        <img src={previewURL} alt="Preview" className="image-preview" />
                                    )}
                                </div>
                            </label>

                            <input type="file" id="file-upload" name="file-upload" accept="image/*" hidden onChange={handleFileChange} />
                        </div>
                    </div>

                    <button className="submit-button" type="submit">Submit Application</button>
                </form>
            </div>
            <ToastContainer
                position="bottom-right"
                autoClose={6000}
                hideProgressBar
                closeOnClick
                pauseOnHover={false}
            />
            <Navbar />
        </div>
    );
}

export default ApplySeller;
