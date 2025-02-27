export const getErrorMessage = (error) => {
  if (error?.json?.reason === 'AlreadyExists' && error?.json?.details?.kind === 'components') {
    return `Component "${error.json?.details?.name}" already exists in this namespace. Edit the name to be unique and try again.`;
  }
  return error.message;
};
