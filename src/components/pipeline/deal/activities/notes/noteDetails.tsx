import { faCircleCheck, faEdit, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Accordion } from 'react-bootstrap';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'react-toastify';
import { Comment } from '../../../../../models/comment';
import { Notes } from '../../../../../models/notes';
import { UserProfile } from '../../../../../models/userProfile';
import { CommentsService } from '../../../../../services/commentsService';
import { NotesService } from '../../../../../services/notesService';
import Comments from '../common/comment';
import { useAuthContext } from '../../../../../contexts/AuthContext';
import { Utility } from '../../../../../models/utility';
import Constants from '../../../../../others/constants';
import LocalStorageUtil from '../../../../../others/LocalStorageUtil';

type params = {
    note: Notes;
    index: number;
    setDialogIsOpen: any;
    setShowDeleteDialog: any;
    setSelectedNoteItem: any;
    setSelectedNoteId: any;
    selectedIndex: any;
    setSelectedIndex: any;
}
const NoteDetails = (props: params) => {
    const { userProfile } = useAuthContext();
    const { index, selectedIndex, ...others } = props;
    const [note, setNote] = useState(props.note);
    const divRef = useRef<HTMLDivElement>(null);
    const userObj = userProfile || new UserProfile();
    const utility: Utility = JSON.parse(
        LocalStorageUtil.getItemObject(Constants.UTILITY) as any
    );
    
    const getCreatorName = (createdBy: number) => {
        const user = utility?.users?.find(u => u.id === createdBy);
        return user?.name || note?.userName || 'Unknown User';
    };
    const [showcomments, setShowComments] = useState(false);
    const commentSvc = new CommentsService(ErrorBoundary);
    const noteSvc = new NotesService(ErrorBoundary);
    const [comment, setComment] = useState(new Comment());
    const [defaultComment, setDefaultComment]=useState(null);
    const commentRef = useRef<HTMLTextAreaElement>(null);
    const [commentError, setCommentError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (divRef.current) {
            divRef.current.innerHTML = note?.noteDetails;
        }
    }, [props])

    const getnote = () => {
        noteSvc.getItem(note.noteID).then(res => {
            // Preserve userName if it's missing from the API response
            setNote({
                ...res,
                userName: res.userName || note.userName
            });
        })
    }

    const saveComment = () => {
        if (isSaving) return; // Prevent duplicate submissions
        
        if (!comment.comment || !comment.comment.trim()) {
            setCommentError("Please enter a comment.");
            return;
        }
        
        setCommentError("");
        setIsSaving(true);
        
        let obj = { ...comment };
        obj.noteId = note.noteID;
        obj.dealID = note.dealID;
        obj.createdBy = userObj.userId;
        
        commentSvc.addComment(obj).then(res => {
            if (res) {
                toast.success("Comment added successfully");
                setDefaultComment(null);
                if (commentRef.current) {
                    commentRef.current.value = "";
                }
                setComment({ ...comment, comment: "" });
                getnote();
            }
        }).catch(err => {
            toast.error("Unable to add comment");
        }).finally(() => {
            setIsSaving(false);
        })
    }

    return (
        <Accordion.Item eventKey={"" + index} key={index}>
            <Accordion.Header onClick={(e: any) => {
                props.setSelectedIndex((prevIndex: any) => prevIndex === index ? null : index);
            }}>
                <span className='accoheader-title'>
                    <strong>Note</strong> by {getCreatorName(note?.createdBy)}
                </span>
                <span className='accoheader-date'>{moment(note?.createdDate).format("MM-DD-YYYY hh:mm:ss a")}</span>
            </Accordion.Header>
            <Accordion.Body>
                    <div className='notecomment-text' ref={divRef}></div>
                    <div className="editstage-delete">
                        <button className="editstage-deletebtn" onClick={(e: any) => { props.setDialogIsOpen(true); props.setSelectedNoteItem(note as any) }}><FontAwesomeIcon icon={faEdit} /></button>
                        <button className="editstage-deletebtn" onClick={(e: any) => { props.setShowDeleteDialog(true); props.setSelectedNoteId(note?.noteID as any) }}><FontAwesomeIcon icon={faTrash} /></button>
                        <a className='margin-left' href="javascript:void(0);"><span style={{ color: "#0091ae" }} onClick={(e: any) => { setShowComments(!showcomments) }}>{showcomments ? note.comments.length > 1 ? 'Hide Comments' : 'Hide Comment' : note.comments.length > 0 ? note.comments.length == 1 ? note.comments.length + " Comment" : note.comments.length + " Comments" : 'Add Comment'} </span></a>
                    </div>
                
                <div className='showcomments' hidden={!showcomments}>
                    <div className='noteuserrow'>
                        {
                        note.comments?.map((c, index) => (
                            <Comments comment={c}
                            loadComments={(e:any)=>getnote()} />
                        ))}
                    </div>
                    <div className='noteUserComment pt-4'>
                        <div className='userEditComment noteuser'><FontAwesomeIcon icon={faUser} /> {userObj?.user}</div>
                        <div className='noteUserCommentTextarea'>
                            <textarea className='form-control pt-4' ref={commentRef} value={comment.comment || ""} onChange={(e: any) => { setComment({ ...comment, comment: e.target.value }); setCommentError(""); }} style={{ minHeight: "150px"}} />
                            {commentError && <div className='text-danger pt-2'>{commentError}</div>}
                        </div>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={(e: any) => saveComment()}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

            </Accordion.Body>
            <div className='accofooter' hidden={index == selectedIndex}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ paddingRight: 5 }} />{note.noteDetails?.replace(/<[^>]*>/g, '')}
            </div>
        </Accordion.Item>
    )
}

export default NoteDetails