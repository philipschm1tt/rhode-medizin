import MainGrid from './mainGrid'

const Article = MainGrid.withComponent('article').extend`
  grid-column: 1 / -1;
  grid-row: 2;
`

export default Article
