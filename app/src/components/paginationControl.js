import React, { Component } from 'react';

class PaginationControl extends Component {
    render() {
        const { props } = this;

        if (!props.pageLimit || props.pageLimit<= 1) { 
            return null;
        };

        const items = [];
        const isFirst = props.page === 1;
        const isLast = props.page === props.pageLimit;

        items.push(
            <li className={isFirst ? "page-item disabled" : "page-item"} key="prev">
                <a className="page-link" onClick={() => props.onPageClick(props.page - 1)}>Previous</a>
            </li>
        );


        for (let i = 1; i <= props.pageLimit; i++) {
            items.push(
                <li className = {i === props.page ? "page-item active" : "page-item"} key={i}>
                    <a className="page-link" onClick = {() => props.onPageClick(i)}>{i}</a>
                </li>
            )
        }

        items.push(
            <li className={isLast ? "page-item disabled" : "page-item"} key="next">
                <a className="page-link" onClick={() => props.onPageClick(props.page + 1)}>Next</a>
            </li>
        );

        return (
            <ul className="pagination"> 
                {items}
            </ul>
        )
    }
}

export default PaginationControl;