export interface IssueCommonData {
  summary?: string;
  source?: string;
  uploadDate?: string;
  status?: string;
}

export type BugObject = IssueCommonData & {
  id: string;
  source: string;
};

export type CVEObject = {
  key?: string;
  component?: string;
  packages: string[];
};

export type IssueObject = BugObject | CVEObject;
