import styled from 'styled-components'

const TileGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;

  > * {
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
    margin-right: ${props => props.theme.sizes.baseLineHeight};
  }

  @supports (display: grid) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(141px, 1fr));
    grid-gap: ${props => props.theme.sizes.baseLineHeight};

    > * {
      width: auto;
      margin: 0;
    }
  }
`

export default TileGrid
