import styled from 'styled-components'

const MainSection = styled.section`
  padding: ${props => props.theme.sizes.outerPadding};
  background-color: ${props =>
    props.darkBackground
      ? props.theme.colors.purple
      : props.theme.colors.lightYellow};

  grid-column: ${props =>
    props.fullWidth ? '1 / -1' : 'main-column-start / main-column-end'};

  @supports (display: grid) {
    padding: ${props =>
        props.fullWidth ? props.theme.sizes.innerPadding : '0'}
      0;
  }

  h2 {
    color: ${props =>
      props.darkBackground
        ? props.theme.colors.lightYellow
        : props.theme.colors.companyBlue};
  }

  ${props =>
    props.fullWidth
      ? `
        display: grid;
        grid-template-columns:
          1.618fr
          [main-column-start] 4.854fr [main-column-end side-column-start] 3fr [side-column-end]
          1fr;

        > * {
          grid-column: main-column-start / side-column-end;
        }
        `
      : ''};
`

export default MainSection
