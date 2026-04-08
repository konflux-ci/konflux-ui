import ComponentsListHeader, { componentsTableColumnClasses } from '../ComponentListHeader';

describe('ComponentListHeader', () => {
  it('returns column definitions with expected titles', () => {
    const headers = ComponentsListHeader();
    expect(headers).toHaveLength(4);
    expect(headers.map((h) => h.title)).toEqual([
      'Name',
      'Git Repository',
      'Image Registry',
      'Component Versions',
    ]);
  });

  it('applies componentsTableColumnClasses to each column', () => {
    const headers = ComponentsListHeader();
    expect(headers[0].props.className).toBe(componentsTableColumnClasses.component);
    expect(headers[1].props.className).toBe(componentsTableColumnClasses.gitRepository);
    expect(headers[2].props.className).toBe(componentsTableColumnClasses.imageRegistry);
    expect(headers[3].props.className).toBe(componentsTableColumnClasses.componentVersions);
  });

  it('exports componentsTableColumnClasses with expected keys', () => {
    expect(componentsTableColumnClasses).toEqual({
      component: 'pf-m-width-30 wrap-column',
      gitRepository: 'pf-m-width-30 wrap-column',
      imageRegistry: 'pf-m-width-30 wrap-column',
      componentVersions: 'pf-m-width-20',
    });
  });
});
