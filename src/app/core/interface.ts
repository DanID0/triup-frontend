export enum Language {
    LATVIAN = 'LATVIAN',
    ENGLISH = 'ENGLISH',
    RUSSIAN = 'RUSSIAN'
  }
  enum AccessType {
    Public = 'Public',
    Privates = 'Privates'
  }
  enum InvitedUserRights {
    Guest = 'Guest',
    Member = 'Member',
    Admin = 'Admin'
  }
  enum Priority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High'
  }
export interface User {
    id: string;
    username: string;
    email: string;
    interfaceLanguage: Language;
    Workspace: Workspace[];
    Tasks: Task[];
    Comments: Comment[];
    UserBoard: UserBoard[];
    UserWorkspace: UserWorkspace[];
}
export interface UserWorkspace{
  id: string;
  userId: string;
  user: User;
  Workspace:Workspace;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace{
  id: string;
  userId: string;
  user: User;
  name: string;
  accessType: AccessType;
  createdAt: string;
  updatedAt: string;
  Boards: Board[];
  UserWorkspace: UserWorkspace[];
}
export interface Board{
  id: string;
  workspaceId: string;
  name: string;
  Workspace:Workspace;
  UserBoard: UserBoard[];
  createdAt: string;
  updatedAt: string;
  columns: Column[]
}

export interface UserBoard{
  id: string;
  userId: string;
  user: User;
  boardId: string;
  board:Board;
  invitedUserRights: InvitedUserRights;
  createdAt: string;
  updatedAt: string;
}

export interface Column{
  id: string;
  boardId: string;
  board:Board;
  position: bigint;
  color: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface Task{
  id: string;
  columnId: string;
  column:Column;
  name:string;
  description:string;
  priority: Priority;
  dueDate: string;
  assigneeId: string;
  asignee: User;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}
  export interface Comment{
    id: string;
    taskId: string;
    task: Task;
    userId:string;
    user: User;
    content:string;
    createdAt: string;
    updatedAt: string;
  }