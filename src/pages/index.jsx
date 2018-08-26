import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import Layout from '../components/layout'
import Article from '../components/article'
import Quote from '../components/quote'
import TileGrid from '../components/tileGrid'
import EmployeeTile from '../components/employeeTile'
import TileList from '../components/tileList'
import ProductGroup from '../components/productGroup'
import HeroBlock from '../components/heroBlock'
import MainSection from '../components/mainSection'
import AsideSection from '../components/asideSection'

import ContentBox from '../components/contentBox'
import MainGrid from '../components/mainGrid'

const IndexPage = props => (
  <Layout>
    <Article>
      <HeroBlock
        mainHeadline="Medizintechnik mit Tradition"
        subHeadline="Medizinische Geräte, Instrumente und Mobilar für Ärzte und Krankenhäuser mit Liefer- und Aufstellservice in Oberbayern."
        callToAction="Jetzt Kontakt aufnehmen"
      />

      <MainSection>
        <ContentBox
          dangerouslySetInnerHTML={{
            __html:
              props.data.service.inhalte[0]
                .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                .html,
          }}
        />
      </MainSection>

      <AsideSection>
        <ContentBox
          dangerouslySetInnerHTML={{
            __html:
              props.data.service.seitenabschnitt.inhalte[0]
                .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                .html,
          }}
        />
      </AsideSection>

      <Quote
        text="Wir nehmen uns Zeit für Sie – Service ist unsere Stärke."
        gridRow="3"
      />

      <MainSection>
        <ContentBox>
          <h2>{props.data.whoWeAre.titel}</h2>
          <TileGrid>
            {props.data.whoWeAre.inhalte.map(mitarbeiter => (
              <EmployeeTile
                name={mitarbeiter.name}
                department={mitarbeiter.dienstbereich}
                photo={mitarbeiter.foto.fixed.src}
                key={mitarbeiter.name}
              />
            ))}
          </TileGrid>
        </ContentBox>
      </MainSection>

      <AsideSection>
        <ContentBox
          dangerouslySetInnerHTML={{
            __html:
              props.data.whoWeAre.seitenabschnitt.inhalte[0]
                .childContentfulTextabschnittTextTextNode.childMarkdownRemark
                .html,
          }}
        />
      </AsideSection>

      <Quote
        text="Wer an Qualität spart, spart am falschen Ende."
        gridRow="5"
      />

      <MainSection darkBackground="true" fullWidth="true">
        <MainGrid>
          <ContentBox>
            <h2>{props.data.ourProducts.titel}</h2>
            <TileList>
              {props.data.ourProducts.inhalte.map(produktGruppe => (
                <ProductGroup
                  name={produktGruppe.name}
                  description={produktGruppe.beschreibung.beschreibung}
                  examples={produktGruppe.beispiele}
                  photo={produktGruppe.foto.fixed.src}
                  key={produktGruppe.name}
                />
              ))}
            </TileList>
          </ContentBox>
        </MainGrid>
      </MainSection>
    </Article>
  </Layout>
)

IndexPage.propTypes = {
  data: PropTypes.object.isRequired,
}

export default IndexPage

export const pageQuery = graphql`
  query {
    service: contentfulAbschnitt(
      titel: { eq: "Service, Beratung, Reparatur" }
    ) {
      inhalte {
        __typename
        ... on ContentfulTextabschnitt {
          childContentfulTextabschnittTextTextNode {
            childMarkdownRemark {
              html
            }
          }
        }
      }
      seitenabschnitt {
        inhalte {
          __typename
          ... on ContentfulTextabschnitt {
            childContentfulTextabschnittTextTextNode {
              childMarkdownRemark {
                html
              }
            }
          }
        }
      }
    }
    whoWeAre: contentfulAbschnitt(titel: { eq: "Wer wir sind" }) {
      titel
      inhalte {
        __typename
        ... on ContentfulMitarbeiter {
          name
          dienstbereich
          foto {
            fixed {
              base64
              width
              height
              src
              srcSet
              srcWebp
              srcSetWebp
            }
          }
        }
      }
      seitenabschnitt {
        inhalte {
          __typename
          ... on ContentfulTextabschnitt {
            childContentfulTextabschnittTextTextNode {
              childMarkdownRemark {
                html
              }
            }
          }
        }
      }
    }
    ourProducts: contentfulAbschnitt(titel: { eq: "Unser Warensortiment" }) {
      titel
      inhalte {
        __typename
        ... on ContentfulProduktgruppe {
          name
          beschreibung {
            beschreibung
          }
          beispiele
          foto {
            fixed {
              base64
              width
              height
              src
              srcSet
              srcWebp
              srcSetWebp
            }
          }
        }
      }
    }
  }
`
