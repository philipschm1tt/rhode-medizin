import styled from 'styled-components'

const AsideSection = styled.aside`
  padding: 20px;
  background-color: ${props => props.theme.colors.lightBlue};

  h3 {
    color: ${props => props.theme.colors.purple};
  }

  h4,
  h5,
  h6,
  p {
    font-size: ${props => props.theme.fontSizes.S};
    line-height: ${props => props.theme.lineHeights.S};
  }
`

export default AsideSection
