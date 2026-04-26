export enum Language {
  LATVIAN = 'LATVIAN',
  ENGLISH = 'ENGLISH',
  RUSSIAN = 'RUSSIAN',
}

export enum AccessType {
  Public = 'Public',
  Privates = 'Privates',
}

export enum InvitedUserRights {
  Guest = 'Guest',
  Member = 'Member',
  Admin = 'Admin',
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  interfaceLanguage: Language;
  Workspace?: Workspace[];
  Tasks?: Task[];
  Comments?: Comment[];
  UserBoard?: UserBoard[];
  UserWorkspace?: UserWorkspace[];
}

export interface UserWorkspace {
  id: string;
  userId: string;
  user?: User;
  workspaceId: string;
  workspace?: Workspace;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  userId: string;
  user?: User;
  name: string;
  accessType: AccessType;
  createdAt: string;
  updatedAt: string;
  Boards?: Board[];
  UserWorkspace?: UserWorkspace[];
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  backgroundImageUrl?: string | null;
  shareToken?: string | null;
  workspace?: Workspace;
  UserBoard?: UserBoard[];
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
}

export interface BoardActivity {
  id: string;
  boardId: string;
  userId: string;
  type: string;
  message: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
  user?: User;
}

export interface UserBoard {
  id: string;
  userId: string;
  user?: User;
  boardId: string;
  board?: Board;
  invitedUserRights: InvitedUserRights;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
}

export interface Column {
  id: string;
  name: string;
  boardId: string;
  board?: Board;
  position: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  columnId: string;
  column?: Column;
  name: string;
  description?: string | null;
  priority: Priority;
  dueDate?: string | null;
  completed?: boolean;
  labels?: string[];
  attachments?: string[];
  assigneeId?: string | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}
