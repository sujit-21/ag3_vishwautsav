import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import musicConcertImg from '../homepage_images/Music Concert.jpg'
import consertImg from '../homepage_images/consert.jpg'
import holiImg from '../homepage_images/holi.jpg'
import southFestivalsImg from '../homepage_images/south festivals.jpg'

const galleryImages = [
    { src: musicConcertImg, title: "Music Concert" },
    { src: consertImg, title: "Live Concert" },
    { src: holiImg, title: "Holi Celebration" },
    { src: southFestivalsImg, title: "South Festivals" }
];

const Gallery = () => {
    return (
        <div className="container py-5 mt-4">
            <div className="d-flex align-items-center mb-5">
                <Link to="/" className="btn btn-outline-primary rounded-pill px-4 me-4 shadow-sm d-flex align-items-center gap-2" style={{ borderColor: 'var(--accent-1)', color: 'var(--accent-1)' }}>
                    <ArrowLeft size={18} /> Back
                </Link>
                <h1 className="display-5 fw-extrabold mb-0" style={{ color: 'var(--text-main)' }}>Vishwa Utsav <span style={{ color: '#D9480F' }}>Gallery</span></h1>
            </div>
            
            <div className="row g-4">
                {galleryImages.map((img, idx) => (
                    <div key={idx} className="col-md-6 col-lg-6">
                        <motion.div 
                            className="glass-card overflow-hidden h-100 rounded-4 shadow-sm position-relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                        >
                            <img src={img.src} alt={img.title} className="w-100" style={{ height: '350px', objectFit: 'cover' }} />
                            <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-white bg-opacity-75 border-top" style={{ backdropFilter: 'blur(10px)' }}>
                                <h5 className="mb-0 fw-bold text-dark text-center">{img.title}</h5>
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Gallery;
