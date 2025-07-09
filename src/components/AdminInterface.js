import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const AdminInterface = () => {
  const [coffices, setCoffices] = useState([]);
  const [newCoffice, setNewCoffice] = useState({ name: '', location: '' });
  const [editingCoffice, setEditingCoffice] = useState(null);

  // Fetch coffices from Firestore
  const fetchCoffices = async () => {
    const cofficesCollection = collection(db, 'coffices');
    const cofficesSnapshot = await getDocs(cofficesCollection);
    const cofficesList = cofficesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCoffices(cofficesList);
  };

  useEffect(() => {
    fetchCoffices();
  }, []);

  // Add a new coffice
  const handleAddCoffice = async () => {
    if (newCoffice.name && newCoffice.location) {
      await addDoc(collection(db, 'coffices'), newCoffice);
      setNewCoffice({ name: '', location: '' });
      fetchCoffices();
    }
  };

  // Update an existing coffice
  const handleUpdateCoffice = async () => {
    if (editingCoffice) {
      const cofficeRef = doc(db, 'coffices', editingCoffice.id);
      await updateDoc(cofficeRef, editingCoffice);
      setEditingCoffice(null);
      fetchCoffices();
    }
  };

  // Delete a coffice
  const handleDeleteCoffice = async (id) => {
    await deleteDoc(doc(db, 'coffices', id));
    fetchCoffices();
  };

  return (
    <Box sx={{ padding: 2, backgroundColor: 'white' }}>
      <h2>Admin Interface</h2>
      <h3>Add New Coffice</h3>
      <TextField
        label="Coffice Name"
        value={newCoffice.name}
        onChange={(e) => setNewCoffice({ ...newCoffice, name: e.target.value })}
      />
      <TextField
        label="Location"
        value={newCoffice.location}
        onChange={(e) => setNewCoffice({ ...newCoffice, location: e.target.value })}
      />
      <Button onClick={handleAddCoffice}>Add Coffice</Button>

      <h3>Coffices List</h3>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coffices.map((coffice) => (
              <TableRow key={coffice.id}>
                <TableCell>
                  {editingCoffice?.id === coffice.id ? (
                    <TextField
                      value={editingCoffice.name}
                      onChange={(e) => setEditingCoffice({ ...editingCoffice, name: e.target.value })}
                    />
                  ) : (
                    coffice.name
                  )}
                </TableCell>
                <TableCell>
                  {editingCoffice?.id === coffice.id ? (
                    <TextField
                      value={editingCoffice.location}
                      onChange={(e) => setEditingCoffice({ ...editingCoffice, location: e.target.value })}
                    />
                  ) : (
                    coffice.location
                  )}
                </TableCell>
                <TableCell>
                  {editingCoffice?.id === coffice.id ? (
                    <>
                      <Button onClick={handleUpdateCoffice}>Save</Button>
                      <Button onClick={() => setEditingCoffice(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditingCoffice(coffice)}>Edit</Button>
                      <Button onClick={() => handleDeleteCoffice(coffice.id)}>Delete</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminInterface; 