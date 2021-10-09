const { execSync } = require("child_process");
const core = require("@actions/core");
const path = require("path");
const fs = require("fs");
import YAML from "yaml";
// const yaml = require("js-yaml");
import fetch from "node-fetch";

const getWorks = async (orcidId) => {
  const response = await fetch(
    `https://pub.orcid.org/v3.0_rc2/${orcidId}/works`,
    {
      headers: {
        Accept: "application/orcid+json",
      },
    }
  );

  if (response.status !== 200) {
    return Promise.reject("Response status: " + response.status);
  }

  return response.json();
};

const getPublication = async (orcidId, putCode) => {
  const response = await fetch(
    `https://pub.orcid.org/v3.0_rc2/${orcidId}/work/${putCode}`,
    {
      headers: {
        Accept: "application/orcid+json",
      },
    }
  );

  if (response.status !== 200) {
    return Promise.reject("Response status: " + response.status);
  }

  return response.json();
};

const run = async () => {
  try {
    const orcidId = core.getInput("orcidId");
    const publicationsFilePath = core.getInput("publicationsFilePath");
    const publicationsFileName = core.getInput("publicationsFileName") + ".yml";
    const publicationsFilePathName = path.join(
      publicationsFilePath,
      publicationsFileName
    );

    console.log(`Retrieving publications from ORCiD.`);

    const response = await getWorks(orcidId);

    let publications = { works: [] };
    publications.works = await Promise.all(
      response.group.map(async (work, index) => {
        const publication = await getPublication(
          orcidId,
          work["work-summary"][0]["put-code"]
        );
        return {
          authors: publication.contributors
            ? publication.contributors.contributor.map((author, index) => {
                return author["credit-name"] != null
                  ? author["credit-name"].value
                  : undefined;
              })
            : undefined,
          journalTitle: publication["journal-title"]
            ? publication["journal-title"].value
            : undefined,
          publicationDate: {
            day: publication["publication-date"].day
              ? publication["publication-date"].day.value
              : undefined,
            month: publication["publication-date"].month
              ? publication["publication-date"].month.value
              : undefined,
            year: publication["publication-date"].year
              ? publication["publication-date"].year.value
              : undefined,
          },
          title: publication.title ? publication.title.title : undefined,
          type: publication.type,
          url: publication.url ? publication.url.value : undefined,
          doi: publication["external-ids"]
            ? publication["external-ids"]["external-id"]
              ? publication["external-ids"]["external-id"][0][
                  "external-id-value"
                ]
              : undefined
            : undefined,
        };
      })
    );
    console.log(publications);
    let publicationsYml = YAML.stringify(publications);

    if (!["", ".", "./"].includes(publicationsFilePath)) {
      console.log(`Creating the folder "${publicationsFilePath}".`);
      fs.mkdirSync(publicationsFilePath, { recursive: true });
    }

    console.log(`Generating publications file.`);
    fs.writeFileSync(publicationsFilePathName, publicationsYml, "utf8");

    console.log(`Committing if new information added.`);
    // git config user.name actions/get-orcid-publications
    execSync(`git config --global user.name actions/get-orcid-publications`);
    // git config user.email get-orcid-publications@thealbert.dev
    execSync(
      `git config --global user.mail get-orcid-publications@thealbert.dev`
    );
    // publicationsFilePathName modified?
    const status = execSync(`git status -s`).toString();

    if (status !== "") {
      // git add ${publicationsFilePathName}
      execSync(`git add ${publicationsFilePathName}`);
      // git commit -m "Retrieve publications from ORCiD"
      execSync(`git commit -m "Retrieve publications from ORCiD"`);
      // git push
      execSync(`git push`);
    }

    core.setOutput("numberOfPublications", publications.works.length);
    core.setOutput("filePath", publicationsFilePathName);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
