import { createGlobalStyle } from 'styled-components'
import styledReset from 'styled-reset'

const GlobalStyle = createGlobalStyle`
  ${styledReset}

  body {
    background-color: ${props => props.theme.colors.base};
    font-family: sans-serif;
  }

  h1, h2, h3 {
    color: ${props => props.theme.colors.companyBlue};
  }

  h1 {
    font-size: ${props => props.theme.fontSizes.smallScreens.XXL};
    line-height: ${props => props.theme.lineHeights.smallScreens.XXL};
    margin-bottom: ${props => props.theme.sizes.halfBaseLineHeight};
    font-weight: bold;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.XXL};
      line-height: ${props => props.theme.lineHeights.largeScreens.XXL};
      margin-bottom: ${props => props.theme.sizes.halfBaseLineHeight};
    }
  }

  h2 {
    font-size: ${props => props.theme.fontSizes.smallScreens.XL};
    line-height: ${props => props.theme.lineHeights.smallScreens.XL};
    margin-top: ${props => props.theme.sizes.baseLineHeight};
    margin-bottom: ${props => props.theme.sizes.halfBaseLineHeight};
    font-weight: bold;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.XL};
      line-height: ${props => props.theme.lineHeights.largeScreens.XL};
      margin-top: ${props => props.theme.sizes.halfBaseLineHeight};
      margin-bottom: ${props => props.theme.sizes.baseLineHeight};
    }
  }

  h3 {
    font-size: ${props => props.theme.fontSizes.smallScreens.L};
    line-height: ${props => props.theme.lineHeights.smallScreens.L};
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
    margin-top: ${props => props.theme.sizes.halfBaseLineHeight};
    font-weight: bold;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.L};
      line-height: ${props => props.theme.lineHeights.largeScreens.L};
      margin-bottom: ${props => props.theme.sizes.baseLineHeight};
      margin-top: ${props => props.theme.sizes.halfBaseLineHeight};
    }
  }

  h4, h5, h6 {
    font-size: ${props => props.theme.fontSizes.smallScreens.L};
    line-height: ${props => props.theme.lineHeights.smallScreens.L};
    margin: ${props => props.theme.sizes.halfBaseLineHeight} 0;
    font-weight: bold;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.L};
      line-height: ${props => props.theme.lineHeights.largeScreens.L};
      margin: ${props => props.theme.sizes.halfBaseLineHeight} 0;
    }
  }

  p {
    font-size: ${props => props.theme.fontSizes.smallScreens.M};
    line-height: ${props => props.theme.lineHeights.smallScreens.M};
    margin-bottom: ${props => props.theme.sizes.baseLineHeight};
    max-width: 30em;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.M};
      line-height: ${props => props.theme.lineHeights.largeScreens.M};
      margin-bottom: ${props => props.theme.sizes.baseLineHeight};
    }
  }

  li {
    font-size: ${props => props.theme.fontSizes.smallScreens.M};
    line-height: ${props => props.theme.lineHeights.smallScreens.M};
    max-width: 30em;

    @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
      font-size: ${props => props.theme.fontSizes.largeScreens.M};
      line-height: ${props => props.theme.lineHeights.largeScreens.M};
    }
  }

  ol, ul {
    list-style: inside;
    margin: ${props => props.theme.sizes.halfBaseLineHeight} 0;
  }
`

export default GlobalStyle
