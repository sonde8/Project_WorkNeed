package com.Workneed.workneed.Members.mapper;

import com.Workneed.workneed.Members.dto.RequestDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RequestMapper {

    void insert(RequestDTO request);

    RequestDTO findById(@Param("requestId") Long requestId);

    void approve(@Param("requestId") Long requestId,
                 @Param("adminId") Long adminId);

    void reject(@Param("requestId") Long requestId,
                @Param("adminId") Long adminId,
                @Param("payload") String payload);

    List<RequestDTO> findPendingAttendanceRequests();
}
