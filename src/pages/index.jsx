import React from 'react'
import styled from 'styled-components'

import Layout from '../components/layout'

const Headline = styled.h1`
  color: blue;
`

const IndexPage = () => (
  <Layout>
    <Headline>Hi people</Headline>
    <p>Welcome to your new Gatsby site.</p>
    <p>Now go build something great.</p>
  </Layout>
)

export default IndexPage
