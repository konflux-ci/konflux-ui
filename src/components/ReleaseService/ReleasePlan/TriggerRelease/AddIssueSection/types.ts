import { CVE } from '../../../../../types/coreBuildService';

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

export type CVEObject = CVE;

export type IssueObject = BugObject | CVEObject;
