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
import LoadingSpinner from './LoadingSpinner';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const sources = ["java","flutter","unity"]
const url = "https://play.google.com"

const MaterialTable = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(()=>{
    axios.get(`${process.env.REACT_APP_BASE_URL}/getDatabase`)
    .then((response)=>{
      setTableData(response.data)
    })
  },[])

  const handleCreateNewRow = (values) => {
    axios.post(`${process.env.REACT_APP_BASE_URL}/create`,values)
    .then(()=>{
      tableData.push(values);
      setTableData([...tableData]);
    })
    
  };

  const handleSaveRowEdits = async ({ exitEditingMode, row, values }) => {
    if (!Object.keys(validationErrors).length) {
      tableData[row.index] = values;
      //send/receive api updates here, then refetch or update local table data for re-render
      axios.post(`${process.env.REACT_APP_BASE_URL}/edit`,values)

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
      axios.post(`${process.env.REACT_APP_BASE_URL}/delete`,{link:`${row.getValue('link')}`})
     
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
    setIsLoading(true);
    try {
      const updatedTableData = await Promise.all(
        tableData.map(async (row) => {
          const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/getApps`, {
            params: { link: row.link,
            code:row.code },
          });
          console.log(response.data.downloads)
          response.data.downloads=convertAbbreviatedNumber(response.data.downloads)
          if(response.data.Live==="Not Live"){
            row.Live="Not Live"
            return row;
          }
          else {
            return response.data;
          }
        })
      );
      setTableData(updatedTableData);
      await axios.post(`${process.env.REACT_APP_BASE_URL}/postApps`,updatedTableData)
      .then(()=>{
        setIsLoading(false);
        alert("Data fetched and saved successfully")
      })
    } catch (error) {
      // Handle any errors that may occur during the requests
      setIsLoading(false);
      console.error("Error fetching data:", error);
    }
  }
  

  const columns = useMemo(
    () => [
      {
        accessorKey: 'link',
        header: 'Link',
        size: 160,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        Cell: ({ cell }) => (
          <Box style={{display: 'flex',
          gap:'10px'
          }}>
            {cell.getValue()}
             {cell.getValue()?(<CopyToClipboard text={cell.getValue()}>
              <button onClick={(e)=>{ e.preventDefault();
                // Check if the event target is the button.
                if (e.target.tagName === 'BUTTON') {
                  alert("Copied to clipboard!");
              }}} style={{
              padding: '4px 16px',
              borderRadius: '4px',
              color: 'black',
              border:'1px solid black',
              backgroundColor:'white'
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
            </CopyToClipboard>):""}
          </Box>
        ),
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
        Cell: ({ cell }) => (
          <Box style={{display: 'flex',
          gap:'10px'
          }}>
            {cell.getValue()?url+cell.getValue():""}
             {cell.getValue()?(<CopyToClipboard text={url+cell.getValue()}>
              <button onClick={(e)=>{ e.preventDefault();
                // Check if the event target is the button.
                if (e.target.tagName === 'BUTTON') {
                  alert("Copied to clipboard!");
              }}} style={{
              padding: '4px 16px',
              borderRadius: '4px',
              color: 'black',
              border:'1px solid black',
              backgroundColor:'white'
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
            </CopyToClipboard>):""}
          </Box>
        ),
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
        Cell: ({ cell }) => (
          <Box
            component="span"
            style={{
              padding: '4px 16px',
              borderRadius: '8px',
              color: 'white',
              backgroundColor: cell.getValue() === 'Live' ? '#62DB2A' : '#DB2A2A',
            }}
          >
            {cell.getValue()}
          </Box>
        ),
      },
      {
        accessorKey: 'website',
        header: 'Website',
        enableEditing: false,
        Cell: ({ cell }) => (
          <Box style={{display: 'flex',
          gap:'10px'
          }}>
            {cell.getValue()}
             {cell.getValue()?(<CopyToClipboard text={cell.getValue()}>
              <button onClick={(e)=>{ e.preventDefault();
                // Check if the event target is the button.
                if (e.target.tagName === 'BUTTON') {
                  alert("Copied to clipboard!");
              }}} style={{
              padding: '4px 16px',
              borderRadius: '4px',
              color: 'black',
              border:'1px solid black',
              backgroundColor:'white'
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
            </CopyToClipboard>):""}
          </Box>
        ),
      },
      {
        accessorKey: 'privacyPolicy',
        header: 'Privacy Policy',
        enableEditing: false,
        Cell: ({ cell }) => (
          <Box style={{display: 'flex',
          gap:'10px'
          }}>
            {cell.getValue()}
             {cell.getValue()?(<CopyToClipboard text={cell.getValue()}>
              <button onClick={(e)=>{ e.preventDefault();
                // Check if the event target is the button.
                if (e.target.tagName === 'BUTTON') {
                  alert("Copied to clipboard!");
              }}} style={{
              padding: '4px 16px',
              borderRadius: '4px',
              color: 'black',
              border:'1px solid black',
              backgroundColor:'white'
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
            </CopyToClipboard>):""}
          </Box>
        ),
      },
      {
        accessorKey: 'supportMail',
        header: 'Support Mail',
        enableEditing: false,
        Cell: ({ cell }) => (
          <Box style={{display: 'flex',
          gap:'10px'
          }}>
            {cell.getValue()?.replace("mailto:", "")}
             {cell.getValue()?(<CopyToClipboard text={cell.getValue().replace("mailto:", "")}>
              <button onClick={(e)=>{ e.preventDefault();
                // Check if the event target is the button.
                if (e.target.tagName === 'BUTTON') {
                  alert("Copied to clipboard!");
              }}} style={{
              padding: '4px 16px',
              borderRadius: '4px',
              color: 'black',
              border:'1px solid black',
              backgroundColor:'white'
            }}><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
            </CopyToClipboard>):""}
          </Box>
        ),
      },
    ],
    [getCommonEditTextFieldProps],
  );

  function convertAbbreviatedNumber(abbreviatedValue) {

    if(abbreviatedValue===undefined){return ""}
    // Remove any non-numeric characters and the '+' sign
    const sanitizedValue = abbreviatedValue.replace(/[^\d.]/g, '');
  
    // Extract the numeric value and magnitude abbreviation
    const numericValue = parseFloat(sanitizedValue);
    const magnitudeAbbreviation = abbreviatedValue.replace(/[0-9.]/g, '').replace('+', '');
  
    // Define multiplier values for K, M, B, etc.
    const multipliers = {
      K: 1e3,
      M: 1e6,
      B: 1e9,
    };
  
    // Check if the magnitude abbreviation exists in the multipliers
    if (multipliers.hasOwnProperty(magnitudeAbbreviation)) {
      // Multiply the numeric value by the corresponding multiplier
      return numericValue * multipliers[magnitudeAbbreviation];
    } else {
      // If no valid abbreviation is found, return the numeric value as is
      return numericValue;
    }
  }
  
  return (
    <>
    {isLoading ? <LoadingSpinner/> : null}
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
