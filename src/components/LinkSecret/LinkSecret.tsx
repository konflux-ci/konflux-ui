import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import { ComponentProps, createModalLauncher } from '../modal/createModalLauncher';
import { SecretSelector } from './SecretSelector';

type DeleteResourceModalProps = ComponentProps & {
  obj: string;
  model?: string;
  displayName?: string;
  isEntryNotRequired?: boolean;
  description?: React.ReactNode;
  submitCallback?: (obj: unknown, namespace?) => void;
};

export const LinkSecret: React.FC<React.PropsWithChildren<DeleteResourceModalProps>> = ({
  onClose,
}) => {
  const [data, setData] = React.useState<string[]>([]);

  const onReset = () => {
    onClose(null, { submitClicked: false });
    return data;
    //needs to be removed
  };

  const linkedSecrets = (value?: string[]) => {
    // console.log("In Link Secrets",data);
    setData(value);
    return value;
  };
  const handleSubmit = () => {
    //   console.log("selected options",data);
    //   console.log(data,"before api call")
    //  makeAPICall();
    onReset();
  };
  // const makeAPICall= async ()=>{
  //   const seceretstolink:SecretKind[]=secrets?.filter((item)=>{
  //     data?.map( (i)=> {return i===item?.metadata.name})
  //   })
  // console.log(secrets[0])
  // const response=await linkSecretToServiceAccounts(secrets[0],["e035d"],SecretForComponentOption.all);
  // console.log(seceretstolink[0],"secret")
  // console.log("Response",response)
  // }

  return (
    <Formik onSubmit={() => handleSubmit()} initialValues={{ resourceName: '' }} onReset={onReset}>
      {() => {
        // const input = values.resourceName;
        // const isValid = input === resourceName;
        // const helpText =
        //   touched && !input ? (
        //     <FormHelperText className="pf-m-warning">{obj} name missing</FormHelperText>
        //   ) : undefined;
        // const validatedState = touched
        //   ? !input
        //     ? ValidatedOptions.warning
        //     : isValid
        //       ? ValidatedOptions.success
        //       : ValidatedOptions.error
        //   : undefined;

        return (
          <>
            <SecretSelector
              linkedSecrets={linkedSecrets}
              onClose={onReset}
              handleSubmit={handleSubmit}
            />
            {/* <div style={{marginTop:"1rem", color:"red"}}>{error}</div> */}
          </>
        );
      }}
    </Formik>
  );
};

export const createDeleteModalLauncher2 = (kind: string) =>
  createModalLauncher(LinkSecret, {
    'data-test': `delete-${kind}-modal`,
    variant: ModalVariant.small,
    title: `Link Secrets?`,
    // titleIconVariant: 'warning',
  });
