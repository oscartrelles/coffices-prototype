// src/CoffeeShopProfile.js
import React from "react";
import RatingForm from "./RatingForm";
import { db } from "./firebaseConfig";
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";

const CoffeeShopProfile = ({ shop, onClose }) => {
  const handleRatingSubmit = async (ratingData) => {
    const shopRef = doc(db, "coffeeShops", shop.place_id);

    // Check if coffee shop already exists in Firestore
    const docSnap = await getDoc(shopRef);
    if (docSnap.exists()) {
      // Update existing coffee shop with new review
      await updateDoc(shopRef, {
        reviews: [...docSnap.data().reviews, ratingData],
      });
    } else {
      // Add new coffee shop to Firestore
      await addDoc(collection(db, "coffeeShops"), {
        id: shop.place_id,
        name: shop.name,
        location: {
          lat: shop.geometry.location.lat(),
          lng: shop.geometry.location.lng(),
        },
        reviews: [ratingData],
      });
    }
  };

  return (
    <div className="modal">
      <button onClick={onClose}>Close</button>
      <h2>{shop.name}</h2>
      <p>Address: {shop.vicinity}</p>
      <RatingForm onSubmit={handleRatingSubmit} />
    </div>
  );
};

