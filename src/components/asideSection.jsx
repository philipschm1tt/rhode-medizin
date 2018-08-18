import styled from 'styled-components'

const AsideSection = styled.aside`
  padding: ${props => props.theme.sizes.outerPadding};
  background-color: ${props => props.theme.colors.lightBlue};

  grid-column: side-column-start / side-column-end;
  grid-row: ${props => (props.gridRow ? props.gridRow : 'unset')};

  @supports (display: grid) {
    padding: 0;
  }

  h3 {
    color: ${props => props.theme.colors.purple};
  }

  h4,
  h5,
  h6,
  p {
    font-size: ${props => props.theme.fontSizes.smallScreens.S};
    line-height: ${props => props.theme.lineHeights.smallScreens.S};

    @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.S};
      line-height: ${props => props.theme.lineHeights.largeScreens.S};
    }
  }

  h4,
  h5,
  h6 {
    margin: 0;
  }
`

export default AsideSection
