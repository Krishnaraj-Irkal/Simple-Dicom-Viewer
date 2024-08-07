import React, { useState, useEffect, Fragment, useRef } from 'react';
import * as dicomParser from 'dicom-parser';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import cornerstone from 'cornerstone-core';

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

if (!cornerstoneWADOImageLoader.initialized) {
    const config = {
        webWorkerPath: '/static/codecs/cornerstoneWADOImageLoaderWebWorker.js',
        taskConfiguration: {
            decodeTask: {
                codecsPath: 'static/codecs/cornerstoneWADOImageLoaderCodecs.js',
            },
        },
    };
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
    cornerstoneWADOImageLoader.initialized = true;
}

const DicomdirUploader = () => {
    const [dicomDirOutput, setDicomdirOutput] = useState([]);
    const [finalOutput, setFinalOutput] = useState([]);
    const [isUploaded, setIsUploaded] = useState(false);
    const [dataFiles, setDataFiles] = useState([]);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (dicomDirOutput.length > 0) {
            buildData();
            setIsUploaded(true);
        }
    }, [dicomDirOutput]);

    useEffect(() => {
        const element = canvasRef.current;
        if (isUploaded && element) {
            cornerstone.enable(element);
        }
    }, [isUploaded]);

    const buildData = (id = null) => {
        let output = [...dicomDirOutput]; // Clone dicomDirOutput to avoid direct state mutation
        if (id !== null) {
            output[id].expanded = !output[id].expanded;
        }
        let images = [];
        let series = [];
        let study = [];
        let patient = [];
        output
            .slice()
            .reverse()
            .forEach((obj, i) => {
                if (obj.key === 'image') {
                    images.unshift({ id: obj.id, key: obj.key, path: obj.path, value: obj.value });
                } else if (obj.key === 'series') {
                    series.unshift({
                        id: obj.id,
                        key: obj.key,
                        number: obj.number,
                        value: obj.value,
                        expanded: obj.expanded,
                        children: images,
                    });
                    images = [];
                } else if (obj.key === 'study') {
                    study.unshift({
                        id: obj.id,
                        key: obj.key,
                        value: obj.value,
                        expanded: obj.expanded,
                        children: series,
                    });
                    series = [];
                } else if (obj.key === 'patient') {
                    patient.unshift({
                        id: obj.id,
                        key: obj.key,
                        value: obj.value,
                        expanded: obj.expanded,
                        children: study,
                    });
                    study = [];
                }
            });
        setFinalOutput(patient);
    };

    const buildOutput = (dataset) => {
        let data = dataset.elements.x00041220.items;
        let output = [];
        if (data) {
            data.forEach((e, index) => {
                const id = index.toString();
                if (e.dataSet.string('x00041430') === 'PATIENT') {
                    output.push({ id: id, key: 'patient', value: e.dataSet.string('x00100010'), expanded: true });
                } else if (e.dataSet.string('x00041430') === 'STUDY') {
                    const value = `${dicomDateToLocale(e.dataSet.string('x00080020'))} - ${dicomTimeToStr(
                        e.dataSet.string('x00080030')
                    )}`;
                    output.push({ id: id, key: 'study', value: value, expanded: true });
                } else if (e.dataSet.string('x00041430') === 'SERIES') {
                    output.push({
                        id: id,
                        key: 'series',
                        number: e.dataSet.string('x00200011'),
                        value: e.dataSet.string('x00080060'),
                        expanded: true,
                    });
                } else if (e.dataSet.string('x00041430') === 'IMAGE') {
                    output.push({
                        id: id,
                        key: 'image',
                        path: e.dataSet.string('x00041500').replace(/\\/g, '/'),
                        value: e.dataSet.string('x00041500').split('\\').pop(),
                        expanded: true,
                    });
                }
            });
        }
        return output;
    };

    const handleOpenDicomdir = (files) => {
        let dicomdir = null;
        let datafiles = [];

        for (let i = 0; i < files.length; i++) {
            if (files[i].webkitRelativePath.includes('DICOMDIR')) {
                dicomdir = files[i];
            } else {
                datafiles.push(files[i]);
            }
        }

        if (dicomdir !== null) {
            var reader = new FileReader();
            reader.onload = async () => {
                let arrayBuffer = reader.result;
                let byteArray = new Uint8Array(arrayBuffer);
                let dataset = null;
                let output = [];
                try {
                    dataset = dicomParser.parseDicom(byteArray);
                    output = await buildOutput(dataset);
                } catch (error) {
                    console.error(error);
                    if (typeof error.dataSet !== 'undefined') {
                        output = await buildOutput(error.dataSet);
                    }
                }
                setDicomdirOutput(output);
                setDataFiles(datafiles);
            };
            reader.readAsArrayBuffer(dicomdir);
        } else {
            // Handle case where no DICOMDIR file was found
            console.warn('The selected folder does not contain any DICOMDIR file.');
        }
    };

    const dicomDateToLocale = (dcmDate) => {
        const date = new Date(
            dcmDate.substring(0, 4) + '-' + dcmDate.substring(4, 6) + '-' + dcmDate.substring(6)
        );
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const dicomTimeToStr = (dcmTime) => {
        return `${dcmTime.substring(0, 2)}:${dcmTime.substring(2, 4)}:${dcmTime.substring(4, 6)}`;
    };

    const ExpandIcon = ({ expanded }) => (expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />);

    const onClick = (id) => {
        const obj = dicomDirOutput.find((x) => x.id === id);
        if (obj.key === 'image') {
            const file = dataFiles.find((f) => f.webkitRelativePath.includes(obj.path));
            if (file) {
                const url = URL.createObjectURL(file);
                cornerstoneWADOImageLoader.wadouri.dataSetCacheManager
                    .load(url, cornerstoneWADOImageLoader.internal.xhrRequest)
                    .then(function (dataSet) {
                        const element = canvasRef.current;
                        const imageId = `wadouri:${url}`;
                        cornerstone.loadImage(imageId).then((image) => {
                            cornerstone.displayImage(element, image);
                        }).catch((error) => {
                            console.error('Error loading DICOM image:', error);
                        });
                    });
            }
        } else {
            buildData(id);
        }
    };

    const studyText = (study) => {
        return study.value;
    };

    const renderTree = (nodes) => (
        <List>
            {nodes.map((node, index) => (
                <Fragment key={index}>
                    <ListItem button onClick={() => onClick(node.id)}>
                        <ListItemText primary={node.value} secondary={node.key} />
                        <ExpandIcon expanded={node.expanded} />
                    </ListItem>
                    <Collapse in={node.expanded} timeout="auto" unmountOnExit>
                        {node.children.map((study) => (
                            <Fragment key={study.id}>
                                <ListItem key={study.id} button dense onClick={() => onClick(study.id)}>
                                    <ListItemText primary={studyText(study)} secondary={study.key} />
                                    <ExpandIcon expanded={study.expanded} />
                                </ListItem>
                                <Collapse in={study.expanded}>
                                    {study.children.map((series) => (
                                        <Fragment key={series.id}>
                                            <ListItem key={series.id} button dense onClick={() => onClick(series.id)}>
                                                <ListItemText primary={`${series.value} (${series.number})`} secondary={series.key} />
                                                <ExpandIcon expanded={study.expanded} />
                                            </ListItem>
                                            <Collapse in={series.expanded}>
                                                {series.children.map((images) => (
                                                    <ListItem key={images.id} button dense onClick={() => onClick(images.id)}>
                                                        <ListItemText primary={images.value} secondary={images.key} />
                                                    </ListItem>
                                                ))}
                                            </Collapse>
                                        </Fragment>
                                    ))}
                                </Collapse>
                            </Fragment>
                        ))}
                    </Collapse>
                </Fragment>
            ))}
        </List>
    );

    return (
        <>
            <div>
                <input
                    type="file"
                    id="file_dicomdir"
                    style={{ display: 'none' }}
                    onChange={(e) => handleOpenDicomdir(e.target.files)}
                    webkitdirectory=""
                    mozdirectory=""
                    directory=""
                    multiple
                />
                <label htmlFor="file_dicomdir">Upload DICOMDIR Folder</label>
                {isUploaded && (
                    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <PerfectScrollbar style={{ height: 'calc(100vh - 48px)', marginTop: '48px', width: '350px' }}>
                            <div style={{ height: 'calc(100vh - 48px)' }}>{renderTree(finalOutput)}</div>
                        </PerfectScrollbar>
                        <div
                            ref={canvasRef}
                            id="dicomImage"
                            style={{ width: '800px', height: '600px', marginLeft: '20px', backgroundColor: 'black' }}
                        ></div>
                    </div>
                )}
            </div>
        </>
    );
};

export default DicomdirUploader;
