import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'react-toastify';
import { DeleteDialog } from '../../../../../common/deleteDialog';
import Util from '../../../../../others/util';
import { NotesService } from '../../../../../services/notesService';
import NotesAddEdit from './notesAddEdit';
import DealNoteDetails from './noteDetails';
import NoteDetails from './noteDetails';
import { Notes } from '../../../../../models/notes';
import { useTheme } from '../../../../../contexts/ThemeContext';

type params = {
  dealId: number;
}
const NotesList = (props: params) => {
  const { dealId, ...others } = props;
  const { currentTheme } = useTheme();
  const notesSvc = new NotesService(ErrorBoundary);
  const [notesList, setNotesList] = useState<Array<Notes>>([]);
  const [error, setError] = useState<AxiosError>();
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number>(0);
  const [selectedNoteItem, setSelectedNoteItem] = useState<Notes>();
  const [selectedIndex, setSelectedIndex]=useState<any>(null);

  useEffect(() => {
    loadNotes();
  }, [])

  const loadNotes = () => {
    setIsLoading(true);
    notesSvc.getNotes(dealId).then(res => {

      (res as Array<Notes>).forEach(i => {
        i.updatedDate = i.updatedDate ?? i.createdDate;
      });
      setNotesList(Util.sortList(res, "updatedDate", "desc"));
      setIsLoading(false);
    }).catch(err => {
      setError(err);
      setIsLoading(false);
    })
  }

  const deleteNote = () => {
    notesSvc
      .deleteNote(selectedNoteId)
      .then((res) => {        
        if(res.success)
          toast.success(res.message);
        else
          toast.error(res.message)
        loadNotes();
      })
      .catch((err) => {
        toast.error("Unable to delete note");
      })
      .finally(() => {
        setSelectedNoteId(0);
        setShowDeleteDialog(false);
      });
  };

  return (
    <>
      {isLoading ? <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}><Spinner /></div> :
        <>
          <div className='text-end'>
            <button 
              className='btn btn-y1app btn-sm' 
              type='button' 
              onClick={(e: any) => setDialogIsOpen(true)}
              style={{
                backgroundColor: currentTheme.primaryColor,
                borderColor: currentTheme.primaryColor,
                color: '#ffffff',
                padding: '4px 12px',
                fontSize: '13px'
              }}
            >
              + Create Note
            </button>
          </div>
          
          {notesList.length > 0 ? (
            <div className='activityfilter-accrow mb-3'>
              <Accordion className='activityfilter-acco'>
                {notesList.map((note, index) => (
                  <NoteDetails note={note} 
                  index={index} 
                  setDialogIsOpen={(e:any)=>{setDialogIsOpen(e)}} 
                  setShowDeleteDialog={(e:any)=>{setShowDeleteDialog(e)}} 
                  setSelectedNoteItem={(e:any)=>{setSelectedNoteItem(e)}} 
                  setSelectedNoteId={(e:any)=>{setSelectedNoteId(e)}}
                  selectedIndex={selectedIndex}
                  setSelectedIndex={(e:any)=>{setSelectedIndex(e)}} />
                ))}
              </Accordion>
            </div>
          ) : (
            <div className='text-center py-5' style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              border: '2px dashed #dee2e6',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '16px' }}>📝</div>
              <h6 style={{ color: '#6c757d', marginBottom: '8px' }}>No notes available</h6>
              <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0' }}>Create your first note to get started</p>
            </div>
          )}
        </>
      }
      {dialogIsOpen && <NotesAddEdit dialogIsOpen={dialogIsOpen}
        dealId={dealId}
        onCloseDialog={(e:any)=>setSelectedNoteItem(null as any)}
        noteItem={selectedNoteItem}
        setDialogIsOpen={setDialogIsOpen}
        onSaveNote={(e: any) => {setSelectedNoteItem(null as any) ; loadNotes()}} />
      }
      {showDeleteDialog &&
        <DeleteDialog itemType={"Note"}
          itemName={""}
          dialogIsOpen={showDeleteDialog}
          closeDialog={(e: any) => setShowDeleteDialog(false)}
          onConfirm={(e: any) => deleteNote()}
          isPromptOnly={false}
          actionType={"Delete"}
        />
      }
    </>
  )
}

export default NotesList