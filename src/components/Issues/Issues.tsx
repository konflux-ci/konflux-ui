import React from "react"
import { DetailsPage } from "../DetailsPage";
import { ISSUES_LIST_PATH } from "@routes/paths";
import { useNamespace } from "~/shared/providers/Namespace";
import { Link } from "react-router-dom";

const Issues: React.FunctionComponent = () => {
    const namespace=useNamespace();
    return (
        <>
        <DetailsPage
          data-test="issues-data-test"
          title="Issues"
          headTitle="Issues"
          description="Summary of issues in your Konflux content at any given point in time"
          actions={[
            {
              key: 'issues',
              id: 'issues-list-page',
              label: 'Issues',
              component: (
                <Link to={ISSUES_LIST_PATH.createPath({ workspaceName: namespace })}>
                  Issues List
                </Link>
              ),
              disabled :false,
              disabledTooltip: "You don't have access to Issues List",
            },
          ]}
          tabs={[
            {
              key: 'index',
              label: 'Overview',
              isFilled: true,
            },
            {
              key: 'issues',
              label: 'Issues',
            },
          ]}
        />
      </>

    )
}
export default Issues;