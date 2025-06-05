import React, { useState, useEffect } from 'react';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [cafes, setCafes] = useState([]);

  useEffect(() => {
    // Fetch users and cafes data
    const fetchUsers = async () => {
      const response = await fetch('/api/users'); // TODO Replace with actual API endpoint
      const data = await response.json();
      setUsers(data);
    };

    const fetchCafes = async () => {
      const response = await fetch('/api/cafes'); // Replace with actual API endpoint
      const data = await response.json();
      setCafes(data);
    };

    fetchUsers();
    fetchCafes();
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
        <h2>Cafes</h2>
        <ul>
          {cafes.map((cafe) => (
            <li key={cafe.id}>
              {cafe.name} - {cafe.location}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Admin;