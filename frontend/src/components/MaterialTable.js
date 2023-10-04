import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios'

const sources = ["java","flutter","unity"]

const MaterialTable = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(()=>{
    axios.get("http://localhost:5000/getDatabase")
    .then((response)=>{
      setTableData(response.data)
    })
  },[])

  const handleCreateNewRow = (values) => {
    axios.post("http://localhost:5000/create",values)
    .then(()=>{
      tableData.push(values);
      setTableData([...tableData]);
    })
    
  };

  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    if (!Object.keys(validationErrors).length) {
      tableData[row.index] = values;
      //send/receive api updates here, then refetch or update local table data for re-render
      axios.post("http://localhost:5000/edit",values)

      setTableData([...tableData]);
      exitEditingMode(); //required to exit editing mode and close modal
    }
  };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRow = useCallback(
    (row) => {
      if (
        !window.confirm(`Are you sure you want to delete ${row.getValue('Name')}`)
      ) {
        return;
      }
      //send api delete request here, then refetch or update local table data for re-render
      axios.post("http://localhost:5000/delete",{link:`${row.getValue('link')}`})
     
      tableData.splice(row.index, 1);
      setTableData([...tableData]);
    },
    [tableData],
  );

  const getCommonEditTextFieldProps = useCallback(
    (cell) => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'email'
              ? validateEmail(event.target.value)
              : cell.column.id === 'age'
              ? validateAge(+event.target.value)
              : validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors],
  );

  async function getApps() {
    try {
      const updatedTableData = await Promise.all(
        tableData.map(async (row) => {
          const response = await axios.get(`http://localhost:5000/getApps`, {
            params: { link: row.link,
            code:row.code },
          });
          return response.data;
        })
      );
      
      setTableData(updatedTableData);
      await axios.post('http://localhost:5000/postApps',updatedTableData)
      .then(()=>{
        alert("Data fetched and saved successfully")
      })
    } catch (error) {
      // Handle any errors that may occur during the requests
      console.error("Error fetching data:", error);
    }
  }
  

  const columns = useMemo(
    () => [
      {
        accessorKey: 'link',
        header: 'Link',
        size: 140,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: 'code',
        header: 'Source',
        size: 80,
        muiTableBodyCellEditTextFieldProps: {
          select: true, //change to select for a dropdown
          children: sources.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          )),
        },
      },
      {
        accessorKey: 'Name',
        header: 'Name',
        size: 140,
        enableEditing: false,
      },
      {
        accessorKey: 'Image',
        header: 'Image',
        size: 140,
        enableEditing: false,
        Cell: ({ cell }) => (
              <Box >
                <img style={{ width: '80px' }} src={cell.getValue()}/>
              </Box>
            ),
      },
      {
        accessorKey: 'Developer',
        header: 'Developer',
        size: 20,
        enableEditing: false,
      },
      {
        accessorKey: 'lastUpdated',
        header: 'Last Updated',
        size: 20,
        enableEditing: false,
      },
      {
        accessorKey: 'downloads',
        header: 'Downloads',
        size: 20,
        enableEditing: false,
      },
      {
        accessorKey: 'Live',
        header: 'Live',
        size: 20,
        enableEditing: false,
      },
      {
        accessorKey: 'website',
        header: 'Website',
        enableEditing: false,
      },
      {
        accessorKey: 'privacyPolicy',
        header: 'Privacy Policy',
        enableEditing: false,
      },
      {
        accessorKey: 'supportMail',
        header: 'Support Mail',
        enableEditing: false,
      },
    ],
    [getCommonEditTextFieldProps],
  );

  return (
    <>
      <MaterialReactTable
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center',
            },
            size: 120,
          },
        }}
        columns={columns}
        data={tableData}
        editingMode="modal" //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <div style={{ display: 'flex', gap: '20px' }}> 
            <Button
            color="secondary"
            onClick={() => setCreateModalOpen(true)}
            variant="contained"
          >
            Add a new app
          </Button>
          <Button
          color="secondary"
          onClick={getApps}
          variant="contained"
        >
          Get Apps Data
        </Button>
         </div>
          
        )}
      />
      <CreateNewAccountModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  );
};

//example of creating a mui dialog modal for creating new rows
export const CreateNewAccountModal = ({ open, columns, onClose, onSubmit }) => {
  const [values, setValues] = useState(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ''] = '';
      return acc;
    }, {}),
  );

  const handleSubmit = () => {
    //put your validation logic here
    onSubmit(values);
    setValues("")
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Create App Link</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.map((column) => (
  <div key={column.accessorKey}>
    {column.accessorKey === 'code' ? (
      <FormControl sx={{width:1}} >
        <InputLabel>Select Language</InputLabel>
        <Select
          name={column.accessorKey}
          onChange={(e) =>
            setValues({ ...values, [e.target.name]: e.target.value })
          }
        >
          {/* Render your dropdown options here */}
          <MenuItem value="flutter">Flutter</MenuItem>
          <MenuItem value="java">Java</MenuItem>
          <MenuItem value="unity">Unity</MenuItem>
        </Select>
      </FormControl>
    ) : (
      <TextField
        sx={{width:1}}
        label={column.header}
        name={column.accessorKey}
        onChange={(e) =>
          setValues({ ...values, [e.target.name]: e.target.value })
        }
      />
    )}
  </div>
))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="secondary" onClick={handleSubmit} variant="contained">
          Create App Link
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value) => !!value.length;
const validateEmail = (email) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
const validateAge = (age) => age >= 18 && age <= 50;

export default MaterialTable;
