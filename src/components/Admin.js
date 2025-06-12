import React, { useState, useEffect } from 'react';

// Check user is logged in.
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Db functions
import { db } from '../firebaseConfig';
import { collection } from "firebase/firestore";
import { getDocs } from "firebase/firestore";

// Admin functions
// import admin from 'firebase-admin';
// const admin = require('firebase-admin');

// TODO: Check current user is: info@oscartrelles.com or "hello@ianmoss.com"

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [coffices, setCoffices] = useState([]);
  const [ratings, setRatings] = useState([]);
  const rowbgcolor = ['white', 'lightgrey'];

  useEffect(() => {
    // TODO: Check user is logged in.
    // TODO: Check user is an admin.
    const fetchUsers = async () => {      
      const response = await fetch('/api/users'); // TODO Replace getRecentUsers();
      const data = await response.json();
      setUsers(data);
    };

    const fetchCoffices = async () => {
      const ratingsCollection = collection(db, 'coffices');
      const ratingsSnapshot = await getDocs(ratingsCollection);      
      setCoffices(ratingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));      
    };

    const fetchRatings = async () => {      
      const ratingsCollection = collection(db, 'ratings');
      const ratingsSnapshot = await getDocs(ratingsCollection);      
      setRatings(ratingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));      
    };

    fetchUsers();
    fetchCoffices();
    fetchRatings();
  }, []);

  return (
    <div>
      <h1>Admin Page</h1>
      <section>
        <h2>Users</h2>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Coffices</h2>
        <ul>
          {coffices.map((cafe) => (
            <li key={cafe.id}>
              {cafe.name} - {
                cafe.location && typeof cafe.location === 'object' && '_lat' in cafe.location && '_long' in cafe.location
                  ? `(${cafe.location._lat}, ${cafe.location._long})`
                  : String(cafe.location)
              }
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Ratings</h2>
        <table>
          <thead>
            <tr>
              <th>Index</th><th>Place</th><th>User</th><th>Comment</th><th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((rating, index) => (
              <tr key={rating.id} bgcolor={rating.comment.length < 16 ? 'red' : 'lightgrey'}>
                <td>{index+1}</td>
                <td>{rating.placeId.substring(0, 5)}</td>
                <td>{rating.userId.substring(0, 5)}</td>
                <td>{rating.comment}</td>
                <td><a href={`/admin/ratings/${rating.id}`}>Edit</a></td>
                <td><a href={`/admin/ratings/${rating.id}`}>X</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Admin;
