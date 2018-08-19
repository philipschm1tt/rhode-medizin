import MainGrid, { MainGridColumns } from './mainGrid'

const Article = MainGrid.withComponent('article').extend`
  grid-column: ${MainGridColumns.fullWidth};
  grid-row: 2;
`

export default Article
