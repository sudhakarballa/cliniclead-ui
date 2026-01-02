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
import { Tasks } from '../../../../../models/task';
import { TaskService } from '../../../../../services/taskService';
import { useAuthContext } from '../../../../../contexts/AuthContext';

type params = {
    task: Tasks;
    index: number;
    setDialogIsOpen: any;
    setShowDeleteDialog: any;
    setSelectedTaskItem: any;
    setSelectedTaskId: any;
    selectedIndex: any;
    setSelectedIndex: any;
}
const TaskDetails = (props: params) => {
    const { userProfile } = useAuthContext();
    const { index, selectedIndex, ...others } = props;
    const [task, setTask] = useState<any>(props.task);
    const divRef = useRef<HTMLDivElement>(null);
    const userObj = userProfile || new UserProfile();
    const [showcomments, setShowComments] = useState(false);
    const commentSvc = new CommentsService(ErrorBoundary);
    const taskSvc = new TaskService(ErrorBoundary);
    const [comment, setComment] = useState(new Comment());
    const [defaultComment, setDefaultComment]=useState(null);
    const commentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(()=>{
        setTask(props.task as any);
    },[props])

    useEffect(() => {
        if (divRef.current) {
            divRef.current.innerHTML = task?.taskDetails;
        }
    }, [props])

    const gettask = () => {
        taskSvc.getItem(task.taskId).then(res => {
            setTask(res.data);
        })
    }

    const saveComment = () => {
        
        let obj = { ...comment };
        obj.taskId = task.taskId;
        obj.dealID = task.dealId;
        obj.createdBy = userObj.userId;
        commentSvc.addComment(obj).then(res => {
            
            if (res) {
                toast.success("Comment added successfully");
                setDefaultComment(null);
                if (commentRef.current) {
                    commentRef.current.value = "";
                }
                gettask();
            }
        }).catch(err => {
            toast.error("Unable to add comment");
        })
    }

    return (
        <Accordion.Item eventKey={"" + index} key={index}>
            <Accordion.Header onClick={(e: any) => {
                props.setSelectedIndex((prevIndex: any) => prevIndex === index ? null : index);
            }}>
                <span className='accoheader-title'>
                    <strong>Task</strong> by {task.userName}
                </span>
                <span className='accoheader-date'>{moment(task.createdDate).format("MM-DD-YYYY hh:mm:ss a")}</span>
            </Accordion.Header>
            <Accordion.Body>
                <div ref={divRef} style={{ maxHeight: "200px", overflow: 'auto' }}></div>
                <div className="editstage-delete">
                    <button className="editstage-deletebtn" onClick={(e: any) => { props.setDialogIsOpen(true); props.setSelectedTaskItem(task as any) }}><FontAwesomeIcon icon={faEdit} /></button>
                    <button className="editstage-deletebtn" onClick={(e: any) => { props.setShowDeleteDialog(true); props.setSelectedTaskItem(task as any) ; props.setSelectedTaskId(task.taskId as any) }}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
                <a href="javascript:void(0);"><span style={{ color: "#0091ae" }} onClick={(e: any) => { setShowComments(!showcomments) }}>{showcomments ? task?.comments?.length > 1 ? 'Hide Comments' : 'Hide Comment' : task.comments?.length > 0 ? task.comments?.length == 1 ? task.comments?.length + " Comment" : task.comments?.length + " Comments" : 'Add Comment'} </span></a>
                <br />
                <br />
                <div hidden={!showcomments}>
                    {
                        task.comments?.map((c: Comment, index: any) => (
                            <Comments comment={c}
                            loadComments={(e:any)=>gettask()} />
                        ))}
                    <FontAwesomeIcon icon={faUser} /> {userObj?.user}
                    <textarea className='form-control pt-4' ref={commentRef} defaultValue={defaultComment as any} onChange={(e: any) => setComment({ ...comment, comment: e.target.value })} style={{ minHeight: "150px", maxWidth: "600px" }} />
                    <br />
                    <button type="button" className="btn btn-secondary" onClick={(e: any) => saveComment()}>Save</button>
                </div>

            </Accordion.Body>
            <div className='accofooter' hidden={index == selectedIndex}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ paddingRight: 5 }} />{task.taskDetails?.replace(/<[^>]*>/g, '')}
            </div>
        </Accordion.Item>
    )
}

export default TaskDetails